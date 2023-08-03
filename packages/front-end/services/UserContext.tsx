import { useGrowthBook } from "@growthbook/growthbook-react";
import { ApiKeyInterface } from "back-end/types/apikey";
import {
  EnvScopedPermission,
  GlobalPermission,
  MemberRole,
  ExpandedMember,
  OrganizationInterface,
  OrganizationSettings,
  Permission,
  Role,
  ProjectScopedPermission,
} from "back-end/types/organization";
import type { AccountPlan, CommercialFeature, LicenseData } from "enterprise";
import { SSOConnectionInterface } from "back-end/types/sso-connection";
import { useRouter } from "next/router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Sentry from "@sentry/react";
import { GROWTHBOOK_SECURE_ATTRIBUTE_SALT } from "shared/constants";
import { isCloud, isSentryEnabled } from "@/services/env";
import useApi from "@/hooks/useApi";
import { useAuth, UserOrganizations } from "@/services/auth";
import track from "@/services/track";
import { AppFeatures } from "@/types/app-features";
import { sha256 } from "@/services/utils";

type OrgSettingsResponse = {
  organization: OrganizationInterface;
  members: ExpandedMember[];
  roles: Role[];
  apiKeys: ApiKeyInterface[];
  enterpriseSSO: SSOConnectionInterface | null;
  accountPlan: AccountPlan;
  commercialFeatures: CommercialFeature[];
  licenseKey?: string;
};

export interface PermissionFunctions {
  check(permission: GlobalPermission): boolean;
  check(
    permission: EnvScopedPermission,
    project: string | undefined,
    envs: string[]
  ): boolean;
  check(
    permission: ProjectScopedPermission,
    project: string | undefined
  ): boolean;
}

export const DEFAULT_PERMISSIONS: Record<GlobalPermission, boolean> = {
  createDimensions: false,
  createPresentations: false,
  createSegments: false,
  manageApiKeys: false,
  manageBilling: false,
  manageNamespaces: false,
  manageNorthStarMetric: false,
  manageSavedGroups: false,
  manageTags: false,
  manageTargetingAttributes: false,
  manageTeam: false,
  manageWebhooks: false,
  manageIntegrations: false,
  organizationSettings: false,
  superDelete: false,
  viewEvents: false,
};

export interface UserContextValue {
  userId?: string;
  name?: string;
  email?: string;
  admin?: boolean;
  license?: LicenseData;
  user?: ExpandedMember;
  users: Map<string, ExpandedMember>;
  getUserDisplay: (id: string, fallback?: boolean) => string;
  updateUser: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  permissions: Record<GlobalPermission, boolean> & PermissionFunctions;
  settings: OrganizationSettings;
  enterpriseSSO?: SSOConnectionInterface;
  accountPlan?: AccountPlan;
  commercialFeatures: CommercialFeature[];
  apiKeys: ApiKeyInterface[];
  organization: Partial<OrganizationInterface>;
  roles: Role[];
  error?: string;
  hasCommercialFeature: (feature: CommercialFeature) => boolean;
}

interface UserResponse {
  status: number;
  userId: string;
  userName: string;
  email: string;
  verified: boolean;
  admin: boolean;
  organizations?: UserOrganizations;
  license?: LicenseData;
}

export const UserContext = createContext<UserContextValue>({
  permissions: { ...DEFAULT_PERMISSIONS, check: () => false },
  settings: {},
  users: new Map(),
  roles: [],
  commercialFeatures: [],
  getUserDisplay: () => "",
  updateUser: async () => {
    // Do nothing
  },
  refreshOrganization: async () => {
    // Do nothing
  },
  apiKeys: [],
  organization: {},
  hasCommercialFeature: () => false,
});

export function useUser() {
  return useContext(UserContext);
}

let currentUser: null | {
  id: string;
  org: string;
  role: MemberRole;
} = null;
export function getCurrentUser() {
  return currentUser;
}

export function getPermissionsByRole(
  role: MemberRole,
  roles: Role[]
): Set<Permission> {
  return new Set<Permission>(
    roles.find((r) => r.id === role)?.permissions || []
  );
}

export function UserContextProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, apiCall, orgId, setOrganizations } = useAuth();

  const [data, setData] = useState<null | UserResponse>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const {
    data: currentOrg,
    mutate: refreshOrganization,
  } = useApi<OrgSettingsResponse>(isAuthenticated ? `/organization` : null);

  const [hashedOrganizationId, setHashedOrganizationId] = useState<string>("");
  useEffect(() => {
    const id = currentOrg?.organization?.id || "";
    sha256(GROWTHBOOK_SECURE_ATTRIBUTE_SALT + id).then((hashedOrgId) => {
      setHashedOrganizationId(hashedOrgId);
    });
  }, [currentOrg?.organization?.id]);

  const updateUser = useCallback(async () => {
    try {
      const res = await apiCall<UserResponse>("/user", {
        method: "GET",
      });
      setData(res);
      if (res.organizations) {
        // @ts-expect-error TS(2722) If you come across this, please fix it!: Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
        setOrganizations(res.organizations);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [apiCall, setOrganizations]);

  const users = useMemo(() => {
    const userMap = new Map<string, ExpandedMember>();
    const members = currentOrg?.members;
    if (!members) return userMap;
    members.forEach((member) => {
      userMap.set(member.id, member);
    });
    return userMap;
  }, [currentOrg?.members]);

  // @ts-expect-error TS(2345) If you come across this, please fix it!: Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
  let user = users.get(data?.userId);
  console.log("user", user);
  if (!user && data) {
    user = {
      email: data.email,
      verified: data.verified,
      id: data.userId,
      environments: [],
      limitAccessByEnvironment: false,
      name: data.userName,
      role: data.admin ? "admin" : "readonly",
      projectRoles: [],
      permissions: {},
    };
  }
  const role =
    (data?.admin && "admin") ||
    (user?.role ?? currentOrg?.organization?.settings?.defaultRole?.role);

  // Build out permissions object for backwards-compatible `permissions.manageTeams` style usage
  const permissionsObj: Record<GlobalPermission, boolean> = {
    ...DEFAULT_PERMISSIONS,
  };
  // @ts-expect-error TS(2345) If you come across this, please fix it!: Argument of type 'MemberRole | undefined' is not a... Remove this comment to see the full error message
  getPermissionsByRole(role, currentOrg?.roles || []).forEach((p) => {
    permissionsObj[p] = true;
  });

  // Update current user data for telemetry data
  useEffect(() => {
    currentUser = {
      org: orgId || "",
      id: data?.userId || "",
      // @ts-expect-error TS(2322) If you come across this, please fix it!: Type 'MemberRole | undefined' is not assignable to... Remove this comment to see the full error message
      role: role,
    };
  }, [orgId, data?.userId, role]);

  // Refresh organization data when switching orgs
  useEffect(() => {
    if (orgId) {
      void refreshOrganization();
      track("Organization Loaded");
    }
  }, [orgId, refreshOrganization]);

  // Once authenticated, get userId, orgId from API
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void updateUser();
  }, [isAuthenticated, updateUser]);

  // Refresh user and org after loading license
  useEffect(() => {
    if (orgId) {
      void refreshOrganization();
    }
    if (isAuthenticated) {
      void updateUser();
    }
  }, [
    orgId,
    isAuthenticated,
    currentOrg?.organization?.licenseKey,
    refreshOrganization,
    updateUser,
  ]);

  // Update growthbook tarageting attributes
  const growthbook = useGrowthBook<AppFeatures>();
  useEffect(() => {
    // @ts-expect-error TS(2532) If you come across this, please fix it!: Object is possibly 'undefined'.
    growthbook.setAttributes({
      id: data?.userId || "",
      name: data?.userName || "",
      admin: data?.admin || false,
      company: currentOrg?.organization?.name || "",
      organizationId: hashedOrganizationId,
      userAgent: window.navigator.userAgent,
      url: router?.pathname || "",
      cloud: isCloud(),
      accountPlan: currentOrg?.accountPlan || "unknown",
      hasLicenseKey: !!data?.license,
      freeSeats: currentOrg?.organization?.freeSeats || 3,
      discountCode: currentOrg?.organization?.discountCode || "",
    });
  }, [data, currentOrg, hashedOrganizationId, router?.pathname, growthbook]);

  useEffect(() => {
    if (!data?.email) return;

    // Error tracking only enabled on GrowthBook Cloud
    if (isSentryEnabled()) {
      Sentry.setUser({ email: data.email, id: data.userId });
    }
  }, [data?.email, data?.userId]);

  const commercialFeatures = useMemo(() => {
    return new Set(currentOrg?.commercialFeatures || []);
  }, [currentOrg?.commercialFeatures]);

  // permissions: {
  //   global: {
  //      createAnalyses: {
  //     hasPermission: true,
  //         environments: [],
  //         limitAccessByEnvironments: false,
  //   },
  //     createFeatureDrafts: {
  //       hasPermission: false,
  //           environments: [],
  //           limitAccessByEnvironments: false,
  //     },
  //   },
  // projects: {
  //   project123: {
  //     createAnalyses: {
  //        hasPermission: true,
  //            environments: [],
  //            limitAccessByEnvironments: false,
  //       },
  //     createFeatureDrafts: {
  //       hasPermission: true,
  //           environments: [],
  //           limitAccessByEnvironments: false,
  //     },
  //   },
  //   project345: {
  //     createAnalyses: {
  //       hasPermission: false,
  //       environments: [],
  //       limitAccessByEnvironments: false,
  //     },
  //     createFeatureDrafts: {
  //       hasPermission: false,
  //         environments: [],
  //         limitAccessByEnvironments: false,
  //     },
  // },
  // },
  // }

  const permissionsCheck = useCallback(
    (
      permission: Permission,
      project?: string | undefined,
      envs?: string[]
    ): boolean => {
      const globalPermissions = user?.permissions.global;
      const projectPermissions = user?.permissions.projects;

      // We first need to check the global permissions and if the user has the global permission, return;
      if (globalPermissions[permission].hasPermission) {
        if (!envs) {
          return true;
        } else {
          if (!globalPermissions[permission].limitAccessByEnvironment) {
            return true;
          } else if (
            globalPermissions[permission].environments.some((e) =>
              envs.includes(e)
            )
          ) {
            return true;
          }
        }
      }

      // If the user doesn't have permission from their global role & a project was passed in, check that project
      if (project) {
        const projectToCheck = projectPermissions[project];
        console.log("projectToCheck", projectToCheck);
        if (projectToCheck && projectToCheck[permission].hasPermission) {
          if (!envs) {
            return true;
          } else {
            if (!projectToCheck[permission].limitAccessByEnvironment) {
              return true;
            } else if (
              projectToCheck[permission].environments.some((e) =>
                envs.includes(e)
              )
            ) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [user]
  );

  return (
    <UserContext.Provider
      value={{
        userId: data?.userId,
        name: data?.userName,
        email: data?.email,
        admin: data?.admin,
        updateUser,
        user,
        users,
        // @ts-expect-error TS(2322) If you come across this, please fix it!: Type '(id: string, fallback?: boolean | undefined)... Remove this comment to see the full error message
        getUserDisplay: (id, fallback = true) => {
          const u = users.get(id);
          if (!u && fallback) return id;
          return u?.name || u?.email;
        },
        refreshOrganization: async () => {
          await refreshOrganization();
        },
        roles: currentOrg?.roles || [],
        permissions: {
          ...permissionsObj,
          check: permissionsCheck,
        },
        settings: currentOrg?.organization?.settings || {},
        license: data?.license,
        // @ts-expect-error TS(2322) If you come across this, please fix it!: Type 'SSOConnectionInterface | null | undefined' i... Remove this comment to see the full error message
        enterpriseSSO: currentOrg?.enterpriseSSO,
        accountPlan: currentOrg?.accountPlan,
        commercialFeatures: currentOrg?.commercialFeatures || [],
        apiKeys: currentOrg?.apiKeys || [],
        // @ts-expect-error TS(2322) If you come across this, please fix it!: Type 'OrganizationInterface | undefined' is not as... Remove this comment to see the full error message
        organization: currentOrg?.organization,
        error,
        hasCommercialFeature: (feature) => commercialFeatures.has(feature),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
