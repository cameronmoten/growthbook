import { z } from "zod";
import { validateFeatureValue } from "shared/util";
import { PostFeatureResponse } from "../../../types/openapi";
import { createApiRequestHandler } from "../../util/handler";
import { postFeatureValidator } from "../../validators/openapi";
import { createFeature, getFeature } from "../../models/FeatureModel";
import { FeatureInterface } from "../../../types/feature";
import { getEnabledEnvironments } from "../../util/features";
import {
  addIdsToRules,
  createInterfaceEnvSettingsFromApiEnvSettings,
  getApiFeatureObj,
  getSavedGroupMap,
} from "../../services/features";
import { auditDetailsCreate } from "../../services/audit";

export type ApiFeatureEnvSettings = NonNullable<
  z.infer<typeof postFeatureValidator.bodySchema>["environments"]
>;

export type ApiFeatureEnvSettingsRules = ApiFeatureEnvSettings[keyof ApiFeatureEnvSettings]["rules"];

export const validateEnvKeys = (
  orgEnvKeys: string[],
  incomingEnvKeys: string[]
) => {
  const invalidEnvKeys = incomingEnvKeys.filter((k) => !orgEnvKeys.includes(k));

  if (invalidEnvKeys.length) {
    throw new Error(
      `Environment key(s) '${invalidEnvKeys.join(
        "', '"
      )}' not recognized. Please create the environment or remove it from your environment settings and try again.`
    );
  }
};

export const postFeature = createApiRequestHandler(postFeatureValidator)(
  async (req): Promise<PostFeatureResponse> => {
    req.checkPermissions("manageFeatures", req.body.project);

    const existing = await getFeature(req.organization.id, req.body.id);
    if (existing) {
      throw new Error(`Feature id '${req.body.id}' already exists.`);
    }

    const orgEnvs = req.organization.settings?.environments || [];

    // ensure environment keys are valid
    validateEnvKeys(
      orgEnvs.map((e) => e.id),
      Object.keys(req.body.environments ?? {})
    );

    const environmentSettings = createInterfaceEnvSettingsFromApiEnvSettings(
      orgEnvs,
      req.body.environments ?? {}
    );

    const feature: FeatureInterface = {
      defaultValue: req.body.defaultValue ?? "",
      valueType: req.body.valueType,
      owner: req.body.owner,
      description: req.body.description || "",
      project: req.body.project || "",
      dateCreated: new Date(),
      dateUpdated: new Date(),
      organization: req.organization.id,
      id: req.body.id.toLowerCase(),
      archived: !!req.body.archived,
      revision: {
        version: 1,
        comment: "New feature",
        date: new Date(),
        publishedBy: {
          id: req.body.owner,
          email: req.body.owner,
          name: req.body.owner,
        },
      },
      jsonSchema: {
        schema: "",
        date: new Date(),
        enabled: false,
      },
      environmentSettings,
    };

    // ensure default value matches value type
    feature.defaultValue = validateFeatureValue(feature, feature.defaultValue);

    req.checkPermissions(
      "publishFeatures",
      feature.project,
      getEnabledEnvironments(feature)
    );

    addIdsToRules(feature.environmentSettings, feature.id);

    await createFeature(req.organization, req.eventAudit, feature);

    await req.audit({
      event: "feature.create",
      entity: {
        object: "feature",
        id: feature.id,
      },
      details: auditDetailsCreate(feature),
    });

    const groupMap = await getSavedGroupMap(req.organization);

    return {
      feature: getApiFeatureObj(feature, req.organization, groupMap),
    };
  }
);
