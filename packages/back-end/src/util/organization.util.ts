import {
  Member,
  MemberRole,
  MemberRoleInfo,
  OrganizationInterface,
  Permission,
  Role,
} from "../../types/organization";

export const ENV_SCOPED_PERMISSIONS = [
  "publishFeatures",
  "manageEnvironments",
  "runExperiments",
] as const;

export const PROJECT_SCOPED_PERMISSIONS = [
  "addComments",
  "createFeatureDrafts",
  "manageFeatures",
  "manageProjects",
  "createAnalyses",
  "createIdeas",
  "createMetrics",
  "createDatasources",
  "editDatasourceSettings",
  "runQueries",
] as const;

export const GLOBAL_PERMISSIONS = [
  "createPresentations",
  "createDimensions",
  "createSegments",
  "organizationSettings",
  "superDelete",
  "manageTeam",
  "manageTags",
  "manageApiKeys",
  "manageIntegrations",
  "manageWebhooks",
  "manageBilling",
  "manageNorthStarMetric",
  "manageTargetingAttributes",
  "manageNamespaces",
  "manageSavedGroups",
  "viewEvents",
] as const;

export const ALL_PERMISSIONS = [
  ...GLOBAL_PERMISSIONS,
  ...PROJECT_SCOPED_PERMISSIONS,
  ...ENV_SCOPED_PERMISSIONS,
];

export function getUserPermissions(user: any, org: OrganizationInterface) {
  const roles = getRoles(org);
  const globalRolePermissions = roles.find((r) => r.id === user.role);
  const userPermissions: any = {};

  userPermissions.global = {
    environments: user.role.environments || [],
    limitAccessByEnvironment: user.role.limitAccessByEnvironment || false,
    permissions: {},
  };

  ALL_PERMISSIONS.forEach((permission) => {
    userPermissions.global.permissions[
      permission
    ] = globalRolePermissions?.permissions.includes(permission) ? true : false;
  });

  userPermissions.projects = {};

  user.projectRoles.forEach((projectRole: any) => {
    const projectRolePermissions = roles.find((r) => r.id === projectRole.role);
    userPermissions.projects[projectRole.project] = {
      limitAccessByEnvironment: projectRole.limitAccessByEnvironment || false,
      environments: projectRole.environments || [],
      permissions: {},
    };
    ALL_PERMISSIONS.forEach((permission) => {
      userPermissions.projects[projectRole.project].permissions[
        permission
      ] = projectRolePermissions?.permissions.includes(permission)
        ? true
        : false;
    });
  });
  return userPermissions;
}

export function getPermissionsByRole(
  role: MemberRole,
  org: OrganizationInterface
): Permission[] {
  const roles = getRoles(org);
  const orgRole = roles.find((r) => r.id === role);
  const permissions = new Set<Permission>(orgRole?.permissions || []);
  return Array.from(permissions);
}

export function getRoles(_organization: OrganizationInterface): Role[] {
  // TODO: support custom roles?
  return [
    {
      id: "readonly",
      description: "View all features and experiment results",
      permissions: [],
    },
    {
      id: "collaborator",
      description: "Add comments and contribute ideas",
      permissions: ["addComments", "createIdeas", "createPresentations"],
    },
    {
      id: "engineer",
      description: "Manage features",
      permissions: [
        "addComments",
        "createIdeas",
        "createPresentations",
        "publishFeatures",
        "manageFeatures",
        "manageTags",
        "createFeatureDrafts",
        "manageTargetingAttributes",
        "manageEnvironments",
        "manageNamespaces",
        "manageSavedGroups",
        "runExperiments",
      ],
    },
    {
      id: "analyst",
      description: "Analyze experiments",
      permissions: [
        "addComments",
        "createIdeas",
        "createPresentations",
        "createAnalyses",
        "createDimensions",
        "createMetrics",
        "manageTags",
        "runQueries",
        "editDatasourceSettings",
      ],
    },
    {
      id: "experimenter",
      description: "Manage features AND Analyze experiments",
      permissions: [
        "addComments",
        "createIdeas",
        "createPresentations",
        "publishFeatures",
        "manageFeatures",
        "createFeatureDrafts",
        "manageTargetingAttributes",
        "manageEnvironments",
        "manageNamespaces",
        "manageSavedGroups",
        "manageTags",
        "runExperiments",
        "createAnalyses",
        "createDimensions",
        "createSegments",
        "createMetrics",
        "runQueries",
        "editDatasourceSettings",
      ],
    },
    {
      id: "admin",
      description:
        "All access + invite teammates and configure organization settings",
      permissions: [...ALL_PERMISSIONS],
    },
  ];
}

export function getDefaultRole(
  organization: OrganizationInterface
): MemberRoleInfo {
  return (
    organization.settings?.defaultRole || {
      environments: [],
      limitAccessByEnvironment: false,
      role: "collaborator",
    }
  );
}
