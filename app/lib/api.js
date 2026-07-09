/**
 * Centralized API layer for Shopify GraphQL operations.
 * All GraphQL mutations/queries go through this module.
 */

/**
 * Submits a review (name + email) as a metaobject via Shopify Admin GraphQL.
 * @param {object} admin - The Shopify admin client from authenticate.admin()
 * @param {object} data - { name: string, email: string }
 * @returns {Promise<object>} The created metaobject response
 */
export async function submitReview(admin, { name, email }) {
  const response = await admin.graphql(
    `#graphql
      mutation ReviewSubmissionUpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
          metaobject {
            id
            handle
            title: field(key: "title") {
              jsonValue
            }
            email: field(key: "email") {
              jsonValue
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        handle: {
          type: "$app:review_submission",
          handle: `review-${Date.now()}`,
        },
        metaobject: {
          fields: [
            { key: "title", value: name },
            { key: "email", value: email },
          ],
        },
      },
    },
  );

  const responseJson = await response.json();
  return responseJson;
}