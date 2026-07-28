"use client";

import {
  useSignUp,
  useSignIn,
  useSignOut,
  useRequestPasswordReset,
  useResetPassword,
  useSendVerificationEmail,
  useVerifyEmail,
} from "@/hooks/use-auth-actions";

export function useAuthActions() {
  const { signUp, isLoading: isSignUpLoading, error: signUpError, clearError: clearSignUpError } = useSignUp();
  const { signIn, isLoading: isSignInLoading, error: signInError, clearError: clearSignInError } = useSignIn();
  const { signOut, isLoading: isSignOutLoading } = useSignOut();
  const { requestReset, isLoading: isRequestResetLoading, error: requestResetError, isSent: isResetSent } = useRequestPasswordReset();
  const { resetPassword, isLoading: isResetPasswordLoading, error: resetPasswordError } = useResetPassword();
  const { sendVerification, isLoading: isSendVerificationLoading, error: sendVerificationError, isSent: isVerificationSent } = useSendVerificationEmail();
  const verifyEmail = useVerifyEmail();

  return {
    // Actions you can call directly
    signUp,
    signIn,
    signOut,
    requestReset,
    resetPassword,
    sendVerification,
    verifyEmail,

    // Grouped states for when you need UI loading/error indicators
    signInState: { isLoading: isSignInLoading, error: signInError, clearError: clearSignInError },
    signUpState: { isLoading: isSignUpLoading, error: signUpError, clearError: clearSignUpError },
    signOutState: { isLoading: isSignOutLoading },
    requestResetState: { isLoading: isRequestResetLoading, error: requestResetError, isSent: isResetSent },
    resetPasswordState: { isLoading: isResetPasswordLoading, error: resetPasswordError },
    sendVerificationState: { isLoading: isSendVerificationLoading, error: sendVerificationError, isSent: isVerificationSent },
  };
}