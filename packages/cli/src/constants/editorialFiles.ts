export const configData = JSON.stringify(
  {
    name: "Editorial",
    publicUrl: "http://localhost:3001/",
    previewUrl: "http://localhost:3001/preview/",
    publicDir: "public/editorialFiles",
    filesUrl: "",
    largeFilesUrl: "",
    firebase: {
      apiKey: "",
      authDomain: "",
      databaseURL: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      dbUsersPath: "",
    },
  },
  null,
  2,
);

export const schemaData = `
# ----------------------------------- Editorial Meta Schema YAML File ------------------------------------
# If you are using an editor that supports JSON Schema, you can use the following URL
# to get validation and autocompletion based on the Editorial meta-schema.
# For example, VSCode with redhat.vscode-yaml extension should work out of the box.
# Make sure to replace "localhost:3001" with the actual address of your Editorial if it's different.
# allowedExtraFields parameter can be used to allow additional fields in the schema that are not defined in the meta-schema.
# Don't uncomment the yaml-language-server line below, it is required for the editor to recognize the schema.
#----------------------------------------------------------------------------------------------------------

# yaml-language-server: $schema=http://localhost:3001/api/v1/meta-schema

# Editorial Schema
dummy:
  displayName: Dummy Object
  fields:
title:
  type: string
  displayName: Title
  showInSummary: true
body:
  type: markdown
  displayName: Body
  displayExtra: "Write anything you want!"
`;

export const dataJson = JSON.stringify(
  {
    dummy: {
      "test-1": {
        id: "test-1",
        title: "Test Object",
        body: "This is a **test** object",
      },
    },
  },
  null,
  2,
);
