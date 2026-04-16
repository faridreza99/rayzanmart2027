import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trackAffiliateClick } from "@/lib/supabase-helpers";

/**
 * Utility to get the current referral code from any storage layer
 * (URL, LocalStorage, SessionStorage, or Cookies)
 */
export const getActiveReferralCode = (): string | null => {
  // 1. Check URL first for the most immediate source
  const urlParams = new URLSearchParams(window.location.search);
  const urlRef = urlParams.get("ref");
  if (urlRef) return urlRef.trim().toUpperCase();

  // 2. Check LocalStorage
  const localRef = localStorage.getItem("affiliate_ref");
  if (localRef) return localRef.trim().toUpperCase();

  // 3. Check SessionStorage
  const sessionRef = sessionStorage.getItem("affiliate_ref");
  if (sessionRef) return sessionRef.trim().toUpperCase();

  // 4. Fallback to Cookie
  const cookieMatch = document.cookie.match(new RegExp('(^| )affiliate_ref=([^;]+)'));
  if (cookieMatch) return cookieMatch[2].trim().toUpperCase();

  return null;
};

/**
 * Hook to track and provide the current affiliate referral code.
 * Using a hook ensures React re-renders when the referral changes.
 */
export const useReferralTracking = () => {
  const [searchParams] = useSearchParams();
  const [activeRef, setActiveRef] = useState<string | null>(getActiveReferralCode());

  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    const current = getActiveReferralCode();

    if (current) {
      setActiveRef(current);

      // Ensure ALL storage layers are synced with the current value
      // This helps if one was cleared but others remain
      const normalizedRef = current.trim().toUpperCase();

      if (localStorage.getItem("affiliate_ref") !== normalizedRef) {
        localStorage.setItem("affiliate_ref", normalizedRef);
      }

      if (sessionStorage.getItem("affiliate_ref") !== normalizedRef) {
        sessionStorage.setItem("affiliate_ref", normalizedRef);
      }

      // Sync cookie if missing or different
      const cookieMatch = document.cookie.match(new RegExp('(^| )affiliate_ref=([^;]+)'));
      if (!cookieMatch || cookieMatch[2] !== normalizedRef) {
        const date = new Date();
        date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
        document.cookie = `affiliate_ref=${normalizedRef}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
      }

      // If it's a NEW click from the URL, track it in the DB
      if (refFromUrl) {
        const sessionTracked = sessionStorage.getItem("affiliate_tracked_this_session");

        if (sessionTracked !== normalizedRef) {
          console.log("[useReferralTracking] New unique referral detected in session:", normalizedRef);
          console.log("[useReferralTracking] Source URL:", window.location.href);

          trackAffiliateClick(normalizedRef, window.location.href);

          // Mark as tracked for THIS session
          sessionStorage.setItem("affiliate_tracked_this_session", normalizedRef);
          // Also keep a record in localStorage but prioritize session for "new click" detection
          localStorage.setItem("affiliate_ref_last_tracked", normalizedRef);
        } else {
          console.log("[useReferralTracking] Referral already tracked in this session:", normalizedRef);
        }
      } else {
        console.log("[useReferralTracking] Active referral active (from storage):", normalizedRef);
      }
    }
  }, [searchParams]);

  return { activeRef, getStoredReferral: getActiveReferralCode };
};