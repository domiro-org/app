import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWideShellSidebar } from "../layouts/WideShellContext";
import { useAppDispatch, useAppState } from "../shared/hooks/useAppState";
import type { DohProviderId } from "../shared/types";

//
// 设置页：承载运行参数（DoH 与 DNS/RDAP 并发）
// 该内容从“导出结果”页面迁移至此，便于信息架构更清晰。
//

const PROVIDER_ORDER: DohProviderId[] = ["google", "cloudflare"]; // 展示顺序固定
const DNS_CONCURRENCY_MARKS = [
  { value: 200, label: "200" },
  { value: 1000, label: "1000" },
  { value: 5000, label: "5000" }
];

/**
 * 设置页，提供运行参数配置。
 */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { settings } = useAppState();
  const dispatch = useAppDispatch();

  // 需至少保留一个 DoH 提供商
  const [providerError, setProviderError] = useState(false);

  useWideShellSidebar(null);

  // 处理 DoH 提供商勾选变更
  const handleProviderToggle = useCallback(
    (provider: DohProviderId) => (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      if (!checked && settings.dohProviders.length === 1 && settings.dohProviders[0] === provider) {
        setProviderError(true);
        return;
      }

      setProviderError(false);
      const nextProviders = checked
        ? sortProviders([...settings.dohProviders, provider])
        : settings.dohProviders.filter((item) => item !== provider);
      dispatch({ type: "settings/update", payload: { dohProviders: nextProviders } });
    },
    [dispatch, settings.dohProviders]
  );

  // RDAP 并发滑块
  const handleRdapConcurrencyChange = useCallback(
    (_event: Event, value: number | number[]) => {
      const nextValue = Array.isArray(value) ? value[0] : value;
      dispatch({ type: "settings/update", payload: { rdapConcurrency: nextValue } });
    },
    [dispatch]
  );

  // DNS 并发滑块
  const handleDnsConcurrencyChange = useCallback(
    (_event: Event, value: number | number[]) => {
      const nextValue = Array.isArray(value) ? value[0] : value;
      dispatch({ type: "settings/update", payload: { dnsConcurrency: nextValue } });
    },
    [dispatch]
  );

  // 动态提示当前并发值
  const rdapHelperText = useMemo(
    () => t("page.export.settings.rdapHelper", { value: settings.rdapConcurrency }),
    [settings.rdapConcurrency, t]
  );
  const dnsHelperText = useMemo(
    () => t("page.export.settings.dnsHelper", { value: settings.dnsConcurrency }),
    [settings.dnsConcurrency, t]
  );

  return (
    <>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h4">{t("page.settings.title")}</Typography>
          <Typography variant="body1" color="text.secondary">
            {t("page.settings.description")}
          </Typography>
        </Stack>
      </Paper>

      <Paper
        elevation={1}
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flexGrow: 1,
          minHeight: 0
        }}
      >
        <Typography variant="h6">{t("page.export.settings.title")}</Typography>

        <FormControl component="fieldset" error={providerError} variant="standard">
          <FormLabel component="legend">{t("page.export.settings.dohLabel")}</FormLabel>
          <FormGroup row>
            {PROVIDER_ORDER.map((provider) => (
              <FormControlLabel
                key={provider}
                control={
                  <Checkbox
                    checked={settings.dohProviders.includes(provider)}
                    onChange={handleProviderToggle(provider)}
                  />
                }
                label={t(`page.export.settings.provider.${provider}`)}
              />
            ))}
          </FormGroup>
          <FormHelperText>
            {providerError && t("page.export.settings.providerError")}
          </FormHelperText>
          {!providerError && (
            <FormHelperText>{t("page.export.settings.dohHelper")}</FormHelperText>
          )}
        </FormControl>

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <FormLabel component="legend">
              {t("page.export.settings.rdapConcurrency")}
            </FormLabel>
            <Typography variant="body2" color="text.secondary">
              {rdapHelperText}
            </Typography>
          </Stack>
          <Slider
            value={settings.rdapConcurrency}
            min={1}
            max={12}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={handleRdapConcurrencyChange}
          />
        </Box>

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <FormLabel component="legend">
              {t("page.export.settings.dnsConcurrency")}
            </FormLabel>
            <Typography variant="body2" color="text.secondary">
              {dnsHelperText}
            </Typography>
          </Stack>
          <Slider
            value={settings.dnsConcurrency}
            min={200}
            max={5000}
            step={100}
            marks={DNS_CONCURRENCY_MARKS}
            valueLabelDisplay="auto"
            onChange={handleDnsConcurrencyChange}
          />
        </Box>

      </Paper>
    </>
  );
}

/**
 * 将 DoH 提供者按既定顺序排序，确保展示一致。
 * @param providers 选中的提供者列表
 * @returns 排序后的提供者列表
 */
function sortProviders(providers: DohProviderId[]): DohProviderId[] {
  return PROVIDER_ORDER.filter((provider) => providers.includes(provider));
}
