import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const callApi = useCallback(async (apiCall, successMessage = null) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiCall();

            if (successMessage && response.data?.success) {
                enqueueSnackbar(successMessage, { variant: 'success' });
            }

            return response.data;
        } catch (err) {
            setError(err.message || 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    return {
        loading,
        error,
        callApi,
        setError,
    };
};