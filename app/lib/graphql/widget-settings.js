/**
 * GraphQL API calls for Widget Settings configuration.
 * All GraphQL queries and mutations for widget settings are housed here.
 */

// GraphQL Queries and Mutations
const GET_SHOP_DEFINITIONS = `#graphql
  query GetShopDefinitions {
    metafieldDefinitions(ownerType: SHOP, first: 50) {
      edges {
        node {
          id
          key
          namespace
          access {
            storefront
          }
        }
      }
    }
  }
`;

const CREATE_METAFIELD_DEFINITION = `#graphql
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_METAFIELD_DEFINITION = `#graphql
  mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition {
        id
        access {
          storefront
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_SHOP_INFO = `#graphql
  query GetShopInfo {
    shop {
      id
      primaryDomain {
        host
      }
      metafield(namespace: "reviews_app", key: "widget_config") {
        value
      }
    }
  }
`;

const GET_SHOP_ID = `#graphql
  query GetShopId {
    shop {
      id
    }
  }
`;

const SAVE_SHOP_METAFIELDS = `#graphql
  mutation SaveShopMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Ensures the storefront-readable shop metafield definition exists and is public.
 * @param {object} admin - Shopify admin GraphQL client
 */
export async function ensureMetafieldDefinition(admin) {
  const defsResponse = await admin.graphql(GET_SHOP_DEFINITIONS);
  const defsJson = await defsResponse.json();
  const edges = defsJson?.data?.metafieldDefinitions?.edges || [];
  const matchedDefinition = edges.find(
    edge => edge.node.namespace === "reviews_app" && edge.node.key === "widget_config"
  );

  if (!matchedDefinition) {
    await admin.graphql(CREATE_METAFIELD_DEFINITION, {
      variables: {
        definition: {
          name: "Widget Configuration",
          namespace: "reviews_app",
          key: "widget_config",
          type: "json",
          ownerType: "SHOP",
          access: {
            storefront: "PUBLIC_READ"
          }
        }
      }
    });
  } else if (matchedDefinition.node.access?.storefront !== "PUBLIC_READ") {
    await admin.graphql(UPDATE_METAFIELD_DEFINITION, {
      variables: {
        definition: {
          id: matchedDefinition.node.id,
          access: {
            storefront: "PUBLIC_READ"
          }
        }
      }
    });
  }
}

/**
 * Fetches widget settings and layout configurations from shop metafields.
 * @param {object} admin - Shopify admin GraphQL client
 * @param {object} session - Session details
 * @returns {Promise<object>} The layout configurations and shop details
 */
export async function getWidgetConfig(admin, session) {
  // Ensure metafield definition exists
  await ensureMetafieldDefinition(admin);

  const shopResponse = await admin.graphql(GET_SHOP_INFO);
  const shopJson = await shopResponse.json();
  const shopData = shopJson?.data?.shop;
  const shopId = shopData?.id || "";
  const shopDomain = shopData?.primaryDomain?.host || session.shop;
  const metafieldValue = shopData?.metafield?.value || "";

  let settings = {};
  if (metafieldValue) {
    try {
      settings = JSON.parse(metafieldValue);
    } catch (e) {
      console.error("Error parsing widget_config metafield JSON:", e);
    }
  }

  const defaultFlat = {
    star_color: "#ffb800",
    button_color: "#005bd3",
    button_text_color: "#ffffff",
    heading_text: "Customer Reviews",
    button_text: "Write a review",
    show_widget_title: true,
    review_word_singular: "review",
    review_word_plural: "reviews",
    no_reviews_text: "Be the first to write a review",
    reply_author_name: "Demoharsh",
    carousel_desktop_slides: 3,
    carousel_mobile_slides: 1,
    carousel_show_arrows: true,
    carousel_auto_slide: false,
    carousel_auto_slide_speed: 5,
    image_carousel_desktop_slides: 4,
    image_carousel_mobile_slides: 2,
    image_carousel_show_arrows: true,
    image_carousel_auto_slide: false,
    image_carousel_auto_slide_speed: 5
  };

  const layoutConfigs = settings.layout_configs || {
    layout_1: { ...defaultFlat },
    layout_2: { ...defaultFlat }
  };

  return {
    selectedLayout: settings.selected_layout || "layout_1",
    layoutConfigs,
    shopId,
    shop: shopDomain
  };
}

/**
 * Saves layout configurations to the shop metafield.
 * @param {object} admin - Shopify admin GraphQL client
 * @param {string} selectedLayout - The active layout ID
 * @param {object} layoutConfigs - Map of layout-specific configurations
 * @returns {Promise<object>} Status and errors if any
 */
export async function saveWidgetConfig(admin, selectedLayout, layoutConfigs) {
  const shopResponse = await admin.graphql(GET_SHOP_ID);
  const shopJson = await shopResponse.json();
  const shopId = shopJson?.data?.shop?.id;

  if (!shopId) {
    return { success: false, error: "Could not retrieve shop ID" };
  }

  const defaultFlat = {
    star_color: "#ffb800",
    button_color: "#005bd3",
    button_text_color: "#ffffff",
    heading_text: "Customer Reviews",
    button_text: "Write a review",
    show_widget_title: true,
    review_word_singular: "review",
    review_word_plural: "reviews",
    no_reviews_text: "Be the first to write a review",
    reply_author_name: "Demoharsh",
    carousel_desktop_slides: 3,
    carousel_mobile_slides: 1,
    carousel_show_arrows: true,
    carousel_auto_slide: false,
    carousel_auto_slide_speed: 5,
    image_carousel_desktop_slides: 4,
    image_carousel_mobile_slides: 2,
    image_carousel_show_arrows: true,
    image_carousel_auto_slide: false,
    image_carousel_auto_slide_speed: 5
  };

  const currentLayoutConfig = layoutConfigs[selectedLayout] || defaultFlat;

  const settingsValue = JSON.stringify({
    selected_layout: selectedLayout,
    layout_configs: layoutConfigs,
    // Flat properties for backward compatibility
    star_color: currentLayoutConfig.star_color || "#ffb800",
    button_color: currentLayoutConfig.button_color || "#005bd3",
    button_text_color: currentLayoutConfig.button_text_color || "#ffffff",
    heading_text: currentLayoutConfig.heading_text || "Customer Reviews",
    button_text: currentLayoutConfig.button_text || "Write a review",
    show_widget_title: currentLayoutConfig.show_widget_title !== undefined ? currentLayoutConfig.show_widget_title : true,
    review_word_singular: currentLayoutConfig.review_word_singular || "review",
    review_word_plural: currentLayoutConfig.review_word_plural || "reviews",
    no_reviews_text: currentLayoutConfig.no_reviews_text || "Be the first to write a review",
    reply_author_name: currentLayoutConfig.reply_author_name || "Demoharsh"
  });

  const saveResponse = await admin.graphql(SAVE_SHOP_METAFIELDS, {
    variables: {
      metafields: [
        {
          ownerId: shopId,
          namespace: "reviews_app",
          key: "widget_config",
          type: "json",
          value: settingsValue
        }
      ]
    }
  });

  const saveJson = await saveResponse.json();
  const errors = saveJson?.data?.metafieldsSet?.userErrors || [];

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    selectedLayout,
    layoutConfigs
  };
}
