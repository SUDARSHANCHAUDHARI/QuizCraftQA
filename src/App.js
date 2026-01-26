  const [aiVariant, setAiVariant] = React.useState(null);
  const [aiVariantLoading, setAiVariantLoading] = React.useState(false);
  const [aiVariantError, setAiVariantError] = React.useState(null);
  const [studyPlan, setStudyPlan] = React.useState(null);
  const [studyPlanLoading, setStudyPlanLoading] = React.useState(false);
  const [studyPlanError, setStudyPlanError] = React.useState(null);

  React.useEffect(() => {
    telemetryOptInRef.current = userSettings.telemetryOptIn;
  }, [userSettings.telemetryOptIn]);

  const logTelemetry = React.useCallback(
    (event, options = {}) => {
      const { force = false } = options;
      setTelemetryLog((prev) => {
        if (!force && !telemetryOptInRef.current) {
          return prev;
        }
        const entry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          ...event,
        };
        return [entry, ...prev].slice(0, 200);
      });
    },
    []
  );

  const handleTelemetryToggle = React.useCallback(
    (enabled) => {
      setUserSettings((prev) => ({ ...prev, telemetryOptIn: Boolean(enabled) }));
      if (!enabled) {
        setTelemetryLog([]);
      }
      logTelemetry(
        {
          category: "telemetry",
          severity: "info",
          message: enabled ? "Telemetry opt-in enabled" : "Telemetry opt-in disabled",
        },
        { force: true }
      );
    },
    [logTelemetry]
  );

  const handleRequestVariant = React.useCallback(async () => {
    if (!userSettings.aiSuggestionsEnabled) {
      setAiVariantError("Enable AI assistance in settings to request variants.");
      return;
    }
    const entry = currentHistoryEntry;
    if (!entry) {
      setAiVariantError("Answer a question before generating a variant.");
      return;
    }
    setAiVariantLoading(true);
    setAiVariantError(null);
    try {
      const variant = await generateVariantQuestion({
        prompt: entry.prompt,
        explanation: entry.explanation,
        correctAnswer: entry.correctAnswer,
        context: entry.contextSnippet || entry.context || "",
      });
      setAiVariant(variant);
      logTelemetry({
        category: "ai",
        severity: "info",
        message: "Generated alternate question",
      });
    } catch (error) {
      setAiVariantError(error?.message || "Failed to generate alternate question.");
      logTelemetry({
        category: "ai",
        severity: "error",
        message: "Variant question request failed",
        context: { error: error?.message || String(error) },
      });
    } finally {
      setAiVariantLoading(false);
    }
  }, [userSettings.aiSuggestionsEnabled, currentHistoryEntry, logTelemetry]);
