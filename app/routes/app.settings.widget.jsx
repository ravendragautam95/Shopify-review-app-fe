import { useState, useEffect } from "react";
import { useLoaderData, useActionData, useNavigation, useSubmit } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

// Import custom sub-components
import LayoutSelector from "../components/widget-settings/LayoutSelector";
import SettingsSidebar from "../components/widget-settings/SettingsSidebar";
import LivePreview from "../components/widget-settings/LivePreview";

// Import centralized GraphQL API layers
import { getWidgetConfig, saveWidgetConfig } from "../lib/graphql/widget-settings";

// Link stylesheet from public/assets/widget.css
export const links = () => [
  { rel: "stylesheet", href: "/assets/widget.css" }
];

// Loader fetches the current widget layout setting and styling from Shop Metafields
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    return await getWidgetConfig(admin, session);
  } catch (error) {
    console.error("Loader error in widget settings:", error);
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
    return {
      selectedLayout: "layout_1",
      layoutConfigs: {
        layout_1: { ...defaultFlat },
        layout_2: { ...defaultFlat }
      },
      shopId: "",
      shop: session?.shop || "demoharsh-1dds80q1.myshopify.com"
    };
  }
};

// Action saves the settings as a JSON string in the Shop Metafields
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const selectedLayout = String(formData.get("selectedLayout") ?? "layout_1");
  const layoutConfigsRaw = formData.get("layoutConfigs");

  let layoutConfigs = {};
  if (layoutConfigsRaw) {
    try {
      layoutConfigs = JSON.parse(String(layoutConfigsRaw));
    } catch (e) {
      console.error("Error parsing layoutConfigs in action:", e);
    }
  }

  try {
    return await saveWidgetConfig(admin, selectedLayout, layoutConfigs);
  } catch (error) {
    console.error("Action error in saving shop metafields:", error);
    return { success: false, error: error.message };
  }
};

export default function WidgetSettings() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const [activeView, setActiveView] = useState("select-layout"); // "select-layout" or "customize-layout"
  const [selectedLayout, setSelectedLayout] = useState(loaderData?.selectedLayout || "layout_1");
  const [publishedLayout, setPublishedLayout] = useState(loaderData?.selectedLayout || "layout_1");

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

  const [layoutConfigs, setLayoutConfigs] = useState(loaderData?.layoutConfigs || {
    layout_1: { ...defaultFlat },
    layout_2: { ...defaultFlat }
  });

  const currentConfig = layoutConfigs[selectedLayout] || defaultFlat;

  const updateCurrentConfig = (key, value) => {
    setLayoutConfigs(prev => ({
      ...prev,
      [selectedLayout]: {
        ...prev[selectedLayout],
        [key]: value
      }
    }));
  };

  // Accordion Control
  const [openAccordion, setOpenAccordion] = useState("install"); // "install", "styling", "text", "header"
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" or "mobile"

  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success) {
      setPublishedLayout(selectedLayout);
      shopify.toast.show("Widget settings saved successfully");
    } else if (actionData?.errors || actionData?.error) {
      const errorMsg = actionData?.errors?.[0]?.message || actionData?.error || "Error saving settings";
      shopify.toast.show(errorMsg);
    }
  }, [actionData, shopify, selectedLayout]);

  // Sync state if loader reloads
  useEffect(() => {
    if (loaderData) {
      setSelectedLayout(loaderData.selectedLayout || "layout_1");
      setPublishedLayout(loaderData.selectedLayout || "layout_1");
      if (loaderData.layoutConfigs) {
        setLayoutConfigs(loaderData.layoutConfigs);
      }
    }
  }, [loaderData]);

  const handleSave = () => {
    submit({
      selectedLayout,
      layoutConfigs: JSON.stringify(layoutConfigs)
    }, { method: "POST" });
  };

  const handleSelectLayout = (layoutId) => {
    setSelectedLayout(layoutId);
    if (layoutId !== "raw_data") {
      setActiveView("customize-layout");
    } else {
      shopify.toast.show("Raw JSON does not support visual customization.");
    }
  };

  const shopName = loaderData?.shop ? loaderData.shop.split(".")[0] : "demoharsh-1dds80q1";
  const themeEditorUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps`;

  // --- STAGE 1: LAYOUT SELECTOR VIEW ---
  if (activeView === "select-layout") {
    return (
      <LayoutSelector
        selectedLayout={selectedLayout}
        handleSelectLayout={handleSelectLayout}
        layoutConfigs={layoutConfigs}
        submit={submit}
        publishedLayout={publishedLayout}
        shop={loaderData?.shop}
      />
    );
  }

  // --- STAGE 2: CUSTOMIZER SPLIT-SCREEN VIEW ---
  return (
    <div
      className="widget-customizer-container"
      style={{
        "--star-color": currentConfig.star_color,
        "--button-color": currentConfig.button_color,
        "--button-text-color": currentConfig.button_text_color
      }}
    >
      <SettingsSidebar
        selectedLayout={selectedLayout}
        currentConfig={currentConfig}
        updateCurrentConfig={updateCurrentConfig}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        themeEditorUrl={themeEditorUrl}
        handleSave={handleSave}
        isSaving={isSaving}
        setActiveView={setActiveView}
        publishedLayout={publishedLayout}
      />

      <LivePreview
        selectedLayout={selectedLayout}
        currentConfig={currentConfig}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        handlePublish={handleSave}
        isPublishing={isSaving}
      />
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
