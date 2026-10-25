import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

// Loads `path` on mount (and whenever it changes). Pass null to skip.
export function useApi(path) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(Boolean(path));
    const [error, setError] = useState("");
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!path) return undefined;

        let cancelled = false;

        api(path)
            .then((result) => {
                if (cancelled) return;
                setData(result);
                setError("");
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Request failed.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [path, version]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    return { data, loading, error, reload, setData };
}
