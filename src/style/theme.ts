import baseStyled, { ThemedStyledInterface } from "styled-components";

const theme = {
  headerHeight: "72px",
  sidebarWidth: "232px",
  sidebarCollapsedWidth: "72px",

  colors: {
    white: "#FFFFFF",
    black: "#131318",
    brand: "#CBF200",

    grey50: "#FCFCFD",
    grey100: "#F3F5F9",
    grey200: "#E3E7EF",
    grey300: "#CED4DA",
    grey400: "#ADB5BD",
    grey500: "#7E838F",
    grey600: "#555B6A",
    grey700: "#373B46",
    grey800: "#272C35",
    grey900: "#131318",

    purple100: "#EFEDFF",
    purple200: "#D5CDFF",
    purple300: "#B2A4FF",
    purple400: "#8E7AFF",
    purple500: "#6F55FF",
    purple600: "#5A44D5",

    red100: "#FDF1F4",
    red200: "#FAC3CD",
    red300: "#F592A3",
    red400: "#F4677F",
    red500: "#EF516C",

    pink100: "#FDF2FA",
    pink200: "#F4C4E3",
    pink300: "#EB97CE",
    pink400: "#E679BF",
    pink500: "#E05BB1",

    yellow100: "#FEF8F1",
    yellow200: "#FBE4C4",
    yellow300: "#F7C98B",
    yellow400: "#F4B865",
    yellow500: "#F1A63F",

    green100: "#E7FAEE",
    green200: "#A1EABE",
    green300: "#58D98C",
    green400: "#3BD377",
    green500: "#2BBF66",

    blue100: "#E7F8FF",
    blue200: "#C1E3FB",
    blue300: "#8FCCF8",
    blue400: "#4CADF4",
    blue500: "#2A9EF2",

    border: "#E3E7EF",

    warning100: "#FDE9CE",
    warning600: "#F79009",

    success100: "#D3F8DF",
    success600: "#099250",

    // TODO DELETE
    // grey: "#6E7175", //  grey500
    // secondaryGrey: "#BEBEBE", // grey300
    // territoryGrey: "#F0F0F0", // grey100
    // bgGrey: "#F6F6F7", // grey100
    // purple: "#3E4DCC", // purple500
    // purpleSecondary: "#ADC0F8", // purple200
    // lightPurple: "#F1F4FE", // purple100
    // lightPurple2: "#F8FAFF", // purple100
    // orange: "#FAAD14", // yellow500
    // orangeLight: "#FFF8E6", // yellow200
    // red: "#F5222D", // red500
    // redLight: "#FFF1F0", // red200
    // green: "#52C41A", // green500
    // greenLight: "#F6FFED", // green200
    // darkGreen: "#1EAA7C", // green500
    // darkGreenLight: "#E9FBF5",  // green200
  },

  // TODO DELETE
  fontSize: {
    xxs: "8px",
    xs: "10px",
    s: "12px",
    m: "14px",
    l: "16px",
    xl: "18px",
    xxl: "20px",
    xxxl: "24px",
  },

  fontWeight: {
    base: 400,
    medium: 500,
    bold: 600,
    bolder: 700,
  },
};

export default theme;

export type Theme = typeof theme;
export const styled = baseStyled as ThemedStyledInterface<Theme>;
