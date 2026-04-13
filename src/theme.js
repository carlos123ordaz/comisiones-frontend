import { alpha, createTheme } from '@mui/material/styles';

export const colorTokens = {
  brand: '#0B3D5C',
  action: '#1F49B6',
  support: '#4E7CDD',
  accentGold: '#E9A61A',
  accentOrange: '#EA8344',
  accentTeal: '#4F9DA5',
  textPrimary: '#3C3C3B',
  textSecondary: '#828281',
  info: '#0088BB',
  background: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#D7DDE3',
  borderStrong: '#BCC6CF',
};

export const chartColors = [
  colorTokens.action,
  colorTokens.support,
  colorTokens.accentTeal,
  colorTokens.accentGold,
  colorTokens.accentOrange,
  '#6A88C9',
];

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colorTokens.action,
      light: colorTokens.support,
      dark: colorTokens.brand,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colorTokens.accentTeal,
      contrastText: '#FFFFFF',
    },
    warning: {
      main: colorTokens.accentGold,
      dark: '#B37B0A',
      contrastText: colorTokens.textPrimary,
    },
    error: {
      main: colorTokens.accentOrange,
      dark: '#C7662D',
      contrastText: '#FFFFFF',
    },
    info: {
      main: colorTokens.info,
      dark: colorTokens.brand,
      contrastText: '#FFFFFF',
    },
    success: {
      main: colorTokens.accentTeal,
      dark: colorTokens.brand,
      contrastText: '#FFFFFF',
    },
    text: {
      primary: colorTokens.textPrimary,
      secondary: colorTokens.textSecondary,
    },
    background: {
      default: colorTokens.background,
      paper: colorTokens.surface,
    },
    divider: colorTokens.border,
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  custom: {
    colors: colorTokens,
    chartColors,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'light',
        },
        body: {
          backgroundColor: colorTokens.background,
          color: colorTokens.textPrimary,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${colorTokens.border}`,
          boxShadow: '0 10px 30px rgba(11, 61, 92, 0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 18,
          minHeight: 40,
        },
        containedPrimary: {
          boxShadow: '0 10px 18px rgba(31, 73, 182, 0.18)',
          ':hover': {
            boxShadow: '0 12px 22px rgba(31, 73, 182, 0.22)',
          },
        },
        outlined: {
          borderColor: colorTokens.borderStrong,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colorTokens.surface,
          borderRadius: 8,
          ':hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colorTokens.borderStrong,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colorTokens.support,
            borderWidth: 1,
            boxShadow: `0 0 0 3px ${alpha(colorTokens.support, 0.14)}`,
          },
        },
        notchedOutline: {
          borderColor: colorTokens.border,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: colorTokens.textSecondary,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: colorTokens.surfaceMuted,
          color: colorTokens.textPrimary,
          fontWeight: 700,
          borderBottom: `1px solid ${colorTokens.border}`,
        },
        body: {
          borderBottom: `1px solid ${alpha(colorTokens.border, 0.8)}`,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          backgroundColor: colorTokens.support,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 52,
          textTransform: 'none',
          fontWeight: 600,
          color: colorTokens.textSecondary,
          '&.Mui-selected': {
            color: colorTokens.brand,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${colorTokens.border}`,
          boxShadow: '0 24px 60px rgba(11, 61, 92, 0.14)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        standardInfo: {
          backgroundColor: alpha(colorTokens.info, 0.08),
          color: colorTokens.brand,
        },
        standardWarning: {
          backgroundColor: alpha(colorTokens.accentGold, 0.12),
        },
        standardSuccess: {
          backgroundColor: alpha(colorTokens.accentTeal, 0.12),
        },
        standardError: {
          backgroundColor: alpha(colorTokens.accentOrange, 0.12),
        },
      },
    },
  },
});
