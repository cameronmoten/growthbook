import { groupApiKeysByType } from "@/services/secret-api-keys.utils";
describe("secret API keys utils", () => {
  describe("groupApiKeysByType", () => {
    const input = [
      {
        _id: "631fa3d6617247133e05debe",
        organization: "org_sktwi1id9l7z9xkjb",
        key: "key_prod_b118a91f4800c2c6",
        description: "production Features SDK",
        environment: "production",
        dateCreated: new Date("2022-09-12T21:25:42.576Z"),
        __v: 0,
      },
      {
        _id: "633dd91af6cc1726c988565c",
        organization: "org_sktwi1id9l7z9xkjb",
        key: "key_stag_28045ec82bc89f3a",
        description: "staging SDK Key",
        environment: "staging",
        dateCreated: new Date("2022-10-05T19:20:58.680Z"),
        __v: 0,
      },
      {
        _id: "63c87bee8eea69359b6803ef",
        environment: "fake_env",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "fake_env SDK Key",
        key: "fake_ziXxEqxRS0vyJDnwjYvkeRuq60XJ76CduoOkfuQjDo",
        secret: false,
        id: "key_sktwial7ld29z9g1",
        dateCreated: new Date("2023-01-18T23:08:30.481Z"),
        __v: 0,
      },
      {
        _id: "63c88225952fdd38e25e6769",
        environment: "env_to_delete_1",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "env_to_delete_1 SDK Key",
        key: "env__XZeVndlWl3Sf2HZFfnyUlKrfgkqg9IPsvT1XzncpPBI",
        secret: false,
        id: "key_sktwib8ild2axd99",
        dateCreated: new Date("2023-01-18T23:35:01.725Z"),
        __v: 0,
      },
      {
        _id: "63c883ddf911a939a26be995",
        environment: "foo_env",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "foo_env SDK Key",
        key: "foo__4hLZMMEzAGQDhWlqovxLFvtRIIkFENqxuQTYqApiJdQ",
        secret: false,
        id: "key_sktwibduld2b6spp",
        dateCreated: new Date("2023-01-18T23:42:21.661Z"),
        __v: 0,
      },
      {
        _id: "63c883e0f911a939a26be9b7",
        environment: "bar_env",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "bar_env SDK Key",
        key: "bar__mz7HCoSIopKFGhpGW8j9PuZ5C29VxG2NppsK2TCnsw",
        secret: false,
        id: "key_sktwibduld2b6v1h",
        dateCreated: new Date("2023-01-18T23:42:24.677Z"),
        __v: 0,
      },
      {
        _id: "63c883e3f911a939a26be9d8",
        environment: "baz_env",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "baz_env SDK Key",
        key: "baz__zF4qcpLn8gWcYqx7xpwbi7ED0xbPbECjANmwGSJEj8",
        secret: false,
        id: "key_sktwibduld2b6xhf",
        dateCreated: new Date("2023-01-18T23:42:27.843Z"),
        __v: 0,
      },
      {
        _id: "63ed536153c102ff55695f00",
        environment: "production",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "local CLI",
        key: "",
        secret: true,
        id: "key_sktwi1efple67hc0a",
        encryptSDK: false,
        role: "admin",
        dateCreated: new Date("2023-02-15T21:49:21.802Z"),
        __v: 0,
      },
      {
        _id: "6418c464f19b58979620d3c6",
        environment: "production",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "Insomnia",
        key: "",
        secret: true,
        id: "key_sktwitxylfhahyil",
        encryptSDK: false,
        role: "admin",
        dateCreated: new Date("2023-03-20T20:39:00.093Z"),
        __v: 0,
      },
      {
        _id: "6452c3450b92297fbff207b0",
        environment: "",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "My test key created in the REPL",
        key: "",
        secret: true,
        id: "key_sktwip8flh85ebhw",
        encryptSDK: false,
        userId: "u_sktwi1id9l7z9xkis",
        dateCreated: new Date("2023-05-03T20:25:41.300Z"),
        __v: 0,
      },
      {
        _id: "6452c39fdf12b2863886ed24",
        environment: "",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "My test key created in the REPL",
        key: "",
        secret: true,
        id: "key_sktwiqiglh85g9fd",
        encryptSDK: false,
        userId: "u_sktwi1id9l7z9xkis",
        dateCreated: new Date("2023-05-03T20:27:11.928Z"),
        __v: 0,
      },
      {
        _id: "6452c3c5df12b2863886ed26",
        environment: "",
        project: "",
        organization: "org_sktwi1id9l7z9xkjb",
        description: "My test readonly key created in the REPL",
        key: "",
        secret: true,
        id: "key_sktwiqiglh85h2k8",
        encryptSDK: false,
        role: "readonly",
        dateCreated: new Date("2023-05-03T20:27:49.688Z"),
        __v: 0,
      },
    ];

    it("should include only secret keys and group them by type", () => {
      const result = groupApiKeysByType(input);

      expect(result.secret).toEqual([
        {
          _id: "63ed536153c102ff55695f00",
          environment: "production",
          project: "",
          organization: "org_sktwi1id9l7z9xkjb",
          description: "local CLI",
          key: "",
          secret: true,
          id: "key_sktwi1efple67hc0a",
          encryptSDK: false,
          role: "admin",
          dateCreated: new Date("2023-02-15T21:49:21.802Z"),
          __v: 0,
        },
        {
          _id: "6418c464f19b58979620d3c6",
          environment: "production",
          project: "",
          organization: "org_sktwi1id9l7z9xkjb",
          description: "Insomnia",
          key: "",
          secret: true,
          id: "key_sktwitxylfhahyil",
          encryptSDK: false,
          role: "admin",
          dateCreated: new Date("2023-03-20T20:39:00.093Z"),
          __v: 0,
        },
      ]);
      expect(result.user).toEqual([
        {
          _id: "6452c3450b92297fbff207b0",
          environment: "",
          project: "",
          organization: "org_sktwi1id9l7z9xkjb",
          description: "My test key created in the REPL",
          key: "",
          secret: true,
          id: "key_sktwip8flh85ebhw",
          encryptSDK: false,
          userId: "u_sktwi1id9l7z9xkis",
          dateCreated: new Date("2023-05-03T20:25:41.300Z"),
          __v: 0,
        },
        {
          _id: "6452c39fdf12b2863886ed24",
          environment: "",
          project: "",
          organization: "org_sktwi1id9l7z9xkjb",
          description: "My test key created in the REPL",
          key: "",
          secret: true,
          id: "key_sktwiqiglh85g9fd",
          encryptSDK: false,
          userId: "u_sktwi1id9l7z9xkis",
          dateCreated: new Date("2023-05-03T20:27:11.928Z"),
          __v: 0,
        },
      ]);
      expect(result.readonly).toEqual([
        {
          _id: "6452c3c5df12b2863886ed26",
          environment: "",
          project: "",
          organization: "org_sktwi1id9l7z9xkjb",
          description: "My test readonly key created in the REPL",
          key: "",
          secret: true,
          id: "key_sktwiqiglh85h2k8",
          encryptSDK: false,
          role: "readonly",
          dateCreated: new Date("2023-05-03T20:27:49.688Z"),
          __v: 0,
        },
      ]);
    });
  });
});
