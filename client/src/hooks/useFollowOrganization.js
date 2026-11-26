import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";

const STORAGE_KEY = "koordinaksi_followed_organizations";

function readLocalFollowed() {
  return (localStorage.getItem(STORAGE_KEY) || "").split(",").filter(Boolean);
}

function writeLocalFollowed(ids) {
  localStorage.setItem(STORAGE_KEY, [...new Set(ids)].join(","));
}

/**
 * Follow / unfollow organisasi.
 * - Belum login → arahkan ke /login dengan state.from
 * - Sudah login → simpan ke backend; sinkron juga ke localStorage sebagai cache
 */
export function useFollowOrganization() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followedIds, setFollowedIds] = useState(readLocalFollowed);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setFollowedIds(readLocalFollowed());
      return;
    }
    let cancelled = false;
    api.get("/organizations/me/following")
      .then(({ data }) => {
        if (cancelled) return;
        const ids = data.organizationIds || [];
        writeLocalFollowed(ids);
        setFollowedIds(ids);
      })
      .catch(() => {
        if (!cancelled) setFollowedIds(readLocalFollowed());
      });
    return () => { cancelled = true; };
  }, [user]);

  const isFollowed = useCallback(
    (organizationId) => followedIds.includes(String(organizationId)),
    [followedIds]
  );

  const toggleFollow = useCallback(async (organizationId, options = {}) => {
    const id = String(organizationId);
    if (!user) {
      const from = options.from || window.location.pathname + window.location.search;
      navigate("/login", {
        state: {
          from,
          message: "Masuk atau daftar terlebih dahulu untuk mengikuti organisasi."
        }
      });
      return { ok: false, reason: "auth" };
    }
    if (busyId) return { ok: false, reason: "busy" };

    const currentlyFollowed = followedIds.includes(id);
    setBusyId(id);
    setError("");
    setFollowedIds((prev) => {
      const next = currentlyFollowed ? prev.filter((x) => x !== id) : [...new Set([...prev, id])];
      writeLocalFollowed(next);
      return next;
    });

    try {
      if (currentlyFollowed) {
        await api.delete(`/organizations/${id}/follow`);
      } else {
        await api.post(`/organizations/${id}/follow`);
      }
      return { ok: true, followed: !currentlyFollowed };
    } catch (err) {
      setFollowedIds((prev) => {
        const next = currentlyFollowed
          ? [...new Set([...prev, id])]
          : prev.filter((x) => x !== id);
        writeLocalFollowed(next);
        return next;
      });
      const message = getErrorMessage(err);
      setError(message);
      return { ok: false, reason: "api", message };
    } finally {
      setBusyId(null);
    }
  }, [user, busyId, followedIds, navigate]);

  return { followedIds, isFollowed, toggleFollow, busyId, error };
}

export default useFollowOrganization;
