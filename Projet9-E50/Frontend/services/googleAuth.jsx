import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { API_URL } from '../constants/Api';
import axios from 'axios';
import { makeRedirectUri } from 'expo-auth-session';
WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = (onSuccess, onError) => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // You get these from Google Cloud Console
    androidClientId: "598032706184-p6gsvrf6cqv0nsogf84j775s1g58ohfb.apps.googleusercontent.com",
    iosClientId: "598032706184-qjlvbvtoe74u9923gbagoc83ci2o9g7s.apps.googleusercontent.com",
    webClientId: "598032706184-nqo2n636su7pjlb11v3r30usjdv8491f.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: 'frontend-auth',
      path: 'oauth2redirect',
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleBackendLogin(authentication.accessToken);
    } else if (response?.type === 'error') {
      onError("Google login failed");
    }
  }, [response]);

  const handleBackendLogin = async (token) => {
    try {
      // Send the token to the backend to find/create the user
      const res = await axios.post(`${API_URL}/auth/google/mobile`, { token });
      onSuccess(res.data);
    } catch (err) {
      onError(err.response?.data?.message || "Backend sync failed");
    }
  };

  return { promptAsync, disabled: !request };
};