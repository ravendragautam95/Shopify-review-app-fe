import { useState, useEffect } from "react";
import { Form, useLoaderData, useActionData, useNavigation, useSubmit, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  let definitionId = null;
  let resolvedType = "account_information";

  try {
    // 1. Fetch definitions to check if account_information exists (under any app-- prefix)
    const defsQuery = `#graphql
      query GetDefinitions {
        metaobjectDefinitions(first: 50) {
          edges {
            node {
              id
              type
            }
          }
        }
      }
    `;
    const defsResponse = await admin.graphql(defsQuery);
    const defsJson = await defsResponse.json();
    const edges = defsJson?.data?.metaobjectDefinitions?.edges || [];
    const matchedEdge = edges.find(edge => edge.node.type.endsWith("account_information"));

    if (matchedEdge) {
      definitionId = matchedEdge.node.id;
      resolvedType = matchedEdge.node.type;
    } else {
      // 2. Create the definition if it doesn't exist
      const createMutation = `#graphql
        mutation CreateDefinition($definition: MetaobjectDefinitionCreateInput!) {
          metaobjectDefinitionCreate(definition: $definition) {
            metaobjectDefinition {
              id
              type
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      const createResponse = await admin.graphql(createMutation, {
        variables: {
          definition: {
            name: "Account Information",
            type: "account_information",
            access: { admin: "MERCHANT_READ_WRITE" },
            fieldDefinitions: [
              { key: "profile_name", name: "Profile Name", type: "single_line_text_field" },
              { key: "company_description", name: "Company Description", type: "multi_line_text_field" },
              { key: "language", name: "Language", type: "single_line_text_field" }
            ]
          }
        }
      });
      const createJson = await createResponse.json();
      const createdDef = createJson?.data?.metaobjectDefinitionCreate?.metaobjectDefinition;
      if (createdDef) {
        definitionId = createdDef.id;
        resolvedType = createdDef.type;
      }
    }

    // 3. Fetch the first metaobject instance of this type
    const valQuery = `#graphql
      query GetMetaobjects($type: String!) {
        metaobjects(type: $type, first: 1) {
          nodes {
            id
            fields {
              key
              value
            }
          }
        }
      }
    `;
    const valResponse = await admin.graphql(valQuery, { variables: { type: resolvedType } });
    const valJson = await valResponse.json();
    const nodes = valJson?.data?.metaobjects?.nodes || [];
    const instance = nodes[0] || null;
    const fields = instance?.fields || [];

    return {
      profile: fields.find(f => f.key === "profile_name")?.value || "",
      companydescription: fields.find(f => f.key === "company_description")?.value || "",
      language: fields.find(f => f.key === "language")?.value || "en",
      instanceId: instance?.id || null,
      resolvedType
    };
  } catch (error) {
    console.error("Loader error in accountinformation:", error);
    return {
      profile: "",
      companydescription: "",
      language: "en",
      instanceId: null,
      resolvedType: "account_information"
    };
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const profile = String(formData.get("profile") ?? "");
  const companydescription = String(formData.get("companydescription") ?? "");
  const language = String(formData.get("language") ?? "en");

  try {
    // 1. Resolve the metaobject type dynamically
    const defsQuery = `#graphql
      query GetDefinitions {
        metaobjectDefinitions(first: 50) {
          edges {
            node {
              id
              type
            }
          }
        }
      }
    `;
    const defsResponse = await admin.graphql(defsQuery);
    const defsJson = await defsResponse.json();
    const edges = defsJson?.data?.metaobjectDefinitions?.edges || [];
    const matchedEdge = edges.find(edge => edge.node.type.endsWith("account_information"));
    const resolvedType = matchedEdge?.node?.type || "account_information";

    // 2. Find if an instance already exists
    const valQuery = `#graphql
      query GetMetaobjects($type: String!) {
        metaobjects(type: $type, first: 1) {
          nodes {
            id
          }
        }
      }
    `;
    const valResponse = await admin.graphql(valQuery, { variables: { type: resolvedType } });
    const valJson = await valResponse.json();
    const nodes = valJson?.data?.metaobjects?.nodes || [];
    const instanceId = nodes[0]?.id || null;

    let result;
    if (instanceId) {
      // Update existing instance
      const updateMutation = `#graphql
        mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
          metaobjectUpdate(id: $id, metaobject: $metaobject) {
            metaobject {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      const response = await admin.graphql(updateMutation, {
        variables: {
          id: instanceId,
          metaobject: {
            fields: [
              { key: "profile_name", value: profile },
              { key: "company_description", value: companydescription },
              { key: "language", value: language }
            ]
          }
        }
      });
      result = await response.json();
      const errors = result?.data?.metaobjectUpdate?.userErrors || [];
      if (errors.length > 0) {
        return { success: false, errors };
      }
    } else {
      // Create new instance
      const createMutation = `#graphql
        mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $metaobject) {
            metaobject {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      const response = await admin.graphql(createMutation, {
        variables: {
          metaobject: {
            type: resolvedType,
            fields: [
              { key: "profile_name", value: profile },
              { key: "company_description", value: companydescription },
              { key: "language", value: language }
            ]
          }
        }
      });
      result = await response.json();
      const errors = result?.data?.metaobjectCreate?.userErrors || [];
      if (errors.length > 0) {
        return { success: false, errors };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Action error in accountinformation:", error);
    return { success: false, error: error.message };
  }
};

export default function AccountInformation() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const [profile, setProfile] = useState(loaderData?.profile || "");
  const [companyDescription, setCompanyDescription] = useState(loaderData?.companydescription || "");
  const [language, setLanguage] = useState(loaderData?.language || "en");

  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show("Account Information saved successfully");
    } else if (actionData?.errors || actionData?.error) {
      const errorMsg = actionData?.errors?.[0]?.message || actionData?.error || "Error saving details";
      shopify.toast.show(errorMsg);
    }
  }, [actionData, shopify]);

  // Sync state if loader reloads with new database data
  useEffect(() => {
    if (loaderData) {
      setProfile(loaderData.profile || "");
      setCompanyDescription(loaderData.companydescription || "");
      setLanguage(loaderData.language || "en");
    }
  }, [loaderData]);

  const handleSave = () => {
    submit(
      {
        profile,
        companydescription: companyDescription,
        language
      },
      { method: "POST" }
    );
  };

  return (
    <s-page heading="Account Information" back-link="/app/settings">
      <s-section heading="Store Details">
        <s-paragraph>
          Manage your store account details and contact information.
        </s-paragraph>
        <s-stack direction="block" gap="base" style={{ maxWidth: "500px", marginTop: "1rem" }}>
          <s-text-field
            label="Profile Name"
            name="profile"
            type="text"
            autoComplete="organization"
            placeholder="Enter profile name"
            value={profile}
            onChange={(e) => setProfile(e.currentTarget.value)}
          />
          <s-text-field
            label="Company Description"
            name="companydescription"
            type="textarea"
            autoComplete="Description"
            placeholder="Enter company description"
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.currentTarget.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
            <label htmlFor="language" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--s-text, #303030)' }}>
              Language
            </label>
            <select
              id="language"
              name="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--s-border-subdued, #e1e3e5)',
                fontSize: '0.9rem',
                background: 'white',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <s-stack direction="inline" gap="base">
            <s-button variant="primary" onClick={handleSave} {...(isSaving ? { loading: true } : {})}>
              Save Account Info
            </s-button>
            <Link to="/app/settings">
              <s-button variant="secondary">Back to Settings</s-button>
            </Link>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Tip">
        <s-paragraph>
          This information is stored securely as a Shopify Metaobject and can be updated at any time.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};