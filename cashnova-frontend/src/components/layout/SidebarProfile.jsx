import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  ChevronDown,
  FolderUp,
  ImagePlus,
  KeyRound,
  LogOut,
  X,
  UserCog,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { clearSessionUser, updateSessionUser } from "../../utils/auth";
import { getSessionUserInitials, useSessionUser } from "../../hooks/useSessionUser";

const ACCOUNTS_KEY = "cashnova_accounts";

const readStoredAccounts = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const accounts = JSON.parse(window.sessionStorage.getItem(ACCOUNTS_KEY) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
};

const normalizeAccount = (account) => ({
  name: account?.name || account?.fullName || account?.displayName || "Cashnova Client",
  fullName: account?.fullName || account?.name || account?.displayName || "Cashnova Client",
  email: account?.email || "",
  avatarUrl: account?.avatarUrl || account?.profileImage || "",
});

const saveStoredAccounts = (accounts) => {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueAccounts = accounts.reduce((items, account) => {
    const normalizedAccount = normalizeAccount(account);
    const accountKey = normalizedAccount.email || normalizedAccount.name;
    const existingIndex = items.findIndex(
      (item) => (item.email || item.name) === accountKey
    );

    if (existingIndex >= 0) {
      items[existingIndex] = { ...items[existingIndex], ...normalizedAccount };
      return items;
    }

    return [...items, normalizedAccount];
  }, []);

  window.sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(uniqueAccounts));
};

const ProfileAvatar = ({ avatarUrl, alt, initials, imageClassName = "h-full w-full rounded-full object-cover", textClassName = "text-sm font-bold" }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowImage = Boolean(avatarUrl) && !imageFailed;

  if (canShowImage) {
    return (
      <img
        src={avatarUrl}
        alt={alt}
        className={imageClassName}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <span className={textClassName}>{initials}</span>;
};

const SidebarProfile = ({ setMobileOpen }) => {
  const navigate = useNavigate();
  const sessionUser = useSessionUser();
  const profileName = sessionUser?.displayName || "Cashnova Client";
  const profileInitials = getSessionUserInitials(sessionUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCard, setActiveCard] = useState("");
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [sidebarPhotoOpen, setSidebarPhotoOpen] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [actionCardPosition, setActionCardPosition] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState(() => readStoredAccounts());
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState("");
  const [addAccountForm, setAddAccountForm] = useState({
    name: "",
    email: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: profileName,
    email: sessionUser?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const menuRef = useRef(null);
  const actionCardRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const stopCamera = ({ close = true } = {}) => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (close) {
      setCameraOpen(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;

    if (!cameraOpen || !video || !cameraStreamRef.current) {
      return;
    }

    video.srcObject = cameraStreamRef.current;
    video.play().catch(() => {
      setMessage("Camera is still loading. Try again.");
    });
  }, [cameraOpen]);

  useEffect(() => {
    setProfileForm({
      name: profileName,
      email: sessionUser?.email || "",
    });
  }, [profileName, sessionUser?.email]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const isInsideMenu = menuRef.current?.contains(event.target);
      const isInsideActionCard = actionCardRef.current?.contains(event.target);

      if (!isInsideMenu && !isInsideActionCard) {
        setMenuOpen(false);
        setPhotoMenuOpen(false);
        setSidebarPhotoOpen(false);
        setAccountSwitcherOpen(false);
        if (activeCard) {
          setActiveCard("");
          setMessage("");
          setPendingAvatarUrl("");
          stopCamera();
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      stopCamera();
    };
  }, [activeCard]);

  const closePanels = () => {
    setMenuOpen(false);
    setPhotoMenuOpen(false);
    setSidebarPhotoOpen(false);
    setAccountSwitcherOpen(false);
    setMobileOpen(false);
  };

  const closeActionCard = () => {
    setActiveCard("");
    setMessage("");
    setPhotoMenuOpen(false);
    setPendingAvatarUrl("");
    stopCamera();
  };

  const updateActionCardPosition = useCallback(() => {
    if (typeof window === "undefined" || !menuRef.current) {
      return;
    }

    const profileRect = menuRef.current.getBoundingClientRect();
    const gap = 18;
    const cardWidth = Math.min(430, window.innerWidth - 32);
    const desktopLeft = profileRect.right + gap;
    const fitsRight = desktopLeft + cardWidth <= window.innerWidth - 16;
    const left = window.innerWidth >= 1024 && fitsRight ? desktopLeft : 16;
    const cardHeightEstimate = 430;
    const upwardOffset = 44;
    const preferredTop = profileRect.bottom - cardHeightEstimate - upwardOffset;
    const top = Math.min(
      Math.max(16, preferredTop),
      Math.max(16, window.innerHeight - cardHeightEstimate - 16)
    );

    setActionCardPosition({
      left,
      top,
      width: cardWidth,
    });
  }, []);

  const showCard = (cardName) => {
    updateActionCardPosition();
    setActiveCard(cardName);
    setMessage("");
    closePanels();
  };

  const handleLogout = () => {
    clearSessionUser();
    closePanels();
    navigate("/auth", { replace: true });
  };

  const handleAddAccount = () => {
    showCard("addAccount");
  };

  useEffect(() => {
    if (!activeCard) {
      return;
    }

    updateActionCardPosition();
    window.addEventListener("resize", updateActionCardPosition);

    return () => window.removeEventListener("resize", updateActionCardPosition);
  }, [activeCard, updateActionCardPosition]);

  const handleAddAccountSubmit = (event) => {
    event.preventDefault();

    const account = {
      name: addAccountForm.name.trim(),
      fullName: addAccountForm.name.trim(),
      email: addAccountForm.email.trim(),
      avatarUrl: "",
    };

    const currentAccount = normalizeAccount({
      name: profileName,
      fullName: profileName,
      email: sessionUser?.email || "",
      avatarUrl: sessionUser?.avatarUrl || "",
    });
    const nextAccounts = [...savedAccounts, currentAccount, account];

    saveStoredAccounts(nextAccounts);
    setSavedAccounts(readStoredAccounts());
    setAddAccountForm({ name: "", email: "" });
    closeActionCard();
  };

  const handleAccountSwitch = (account) => {
    updateSessionUser(normalizeAccount(account));
    setAccountSwitcherOpen(false);
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const handleDeleteAccount = (event, account) => {
    event.stopPropagation();

    const accountToDelete = normalizeAccount(account);
    const nextAccounts = savedAccounts.filter((savedAccount) => {
      const normalizedAccount = normalizeAccount(savedAccount);
      return (
        normalizedAccount.email !== accountToDelete.email ||
        normalizedAccount.name !== accountToDelete.name
      );
    });

    saveStoredAccounts(nextAccounts);
    setSavedAccounts(readStoredAccounts());
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const updatedProfile = await api.updateProfile({
        name: profileForm.name,
        fullName: profileForm.name,
        email: profileForm.email,
      });

      updateSessionUser({
        ...(updatedProfile || {}),
        name: updatedProfile?.name || updatedProfile?.fullName || profileForm.name,
        fullName: updatedProfile?.fullName || updatedProfile?.name || profileForm.name,
        email: updatedProfile?.email || profileForm.email,
      });
      closeActionCard();
      setPhotoMenuOpen(false);
      setPendingAvatarUrl("");
      stopCamera();
    } catch {
      setMessage("Could not update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("New password and confirm password must match.");
      setIsSaving(false);
      return;
    }

    try {
      await api.changePassword(passwordForm);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      closeActionCard();
    } catch {
      setMessage("Could not update password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSelected = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      setPendingAvatarUrl(String(reader.result || ""));
      setPhotoMenuOpen(false);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleOpenCamera = async () => {
    setMessage("");
    setPendingAvatarUrl("");
    setPhotoMenuOpen(false);
    setSidebarPhotoOpen(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Camera is not available in this browser.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setMessage("Camera permission was blocked or no camera was found.");
      setCameraOpen(false);
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setMessage("Camera is still loading. Try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    setPendingAvatarUrl(canvas.toDataURL("image/png"));
    stopCamera({ close: false });
  };

  const uploadProfilePhoto = async (avatarUrl) => {
    updateSessionUser({ avatarUrl, profileImage: avatarUrl });
    saveStoredAccounts([
      ...savedAccounts,
      {
        name: profileName,
        fullName: profileName,
        email: sessionUser?.email || "",
        avatarUrl,
      },
    ]);
    setSavedAccounts(readStoredAccounts());
    setPhotoMenuOpen(false);
    stopCamera();

    try {
      await api.updateProfile({ avatarUrl, profileImage: avatarUrl });
    } catch {
      setMessage("Profile photo updated here. Backend upload failed.");
    } finally {
      setPendingAvatarUrl("");
      setSidebarPhotoOpen(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!pendingAvatarUrl) {
      return;
    }

    await uploadProfilePhoto(pendingAvatarUrl);
  };

  const handleCameraDone = async () => {
    if (!pendingAvatarUrl) {
      return;
    }

    await uploadProfilePhoto(pendingAvatarUrl);
    setActiveCard("");
    setMenuOpen(false);
    setAccountSwitcherOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <div ref={menuRef} className="relative mt-5">
      <button
        type="button"
        onClick={() => {
          if (activeCard) {
            closeActionCard();
            setMenuOpen(false);
            return;
          }

          setMenuOpen((open) => !open);
        }}
        className={`theme-sidebar-link flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow] hover:bg-white/12 ${
          menuOpen ? "border-white/80 bg-white/8" : "border-white/10 bg-white/8"
        }`}
        aria-expanded={menuOpen}
      >
        <div className="relative">
          <div
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              setSidebarPhotoOpen((open) => !open);
              setPendingAvatarUrl("");
              stopCamera();
              setAccountSwitcherOpen(false);
              setMenuOpen(false);
              setPhotoMenuOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                setSidebarPhotoOpen((open) => !open);
                setPendingAvatarUrl("");
                stopCamera();
                setAccountSwitcherOpen(false);
                setMenuOpen(false);
                setPhotoMenuOpen(false);
              }
            }}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/50 bg-[linear-gradient(145deg,#fff9fd_0%,#f5ecff_100%)] text-[#1f5f7a] shadow-[0_12px_22px_rgba(9,30,43,0.18)]"
            aria-label="Show saved accounts"
          >
            <ProfileAvatar
              avatarUrl={sessionUser?.avatarUrl}
              alt={profileName}
              initials={profileInitials}
            />
          </div>
          <span className="absolute right-0 top-1 h-3 w-3 rounded-full border-2 border-[#294556] bg-[#22C55E]" aria-hidden="true" />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            setAccountSwitcherOpen((open) => !open);
            setSidebarPhotoOpen(false);
            setMenuOpen(false);
            setPhotoMenuOpen(false);
            stopCamera();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              setAccountSwitcherOpen((open) => !open);
              setSidebarPhotoOpen(false);
              setMenuOpen(false);
              setPhotoMenuOpen(false);
              stopCamera();
            }
          }}
          className="min-w-0 flex-1"
          aria-label="Show saved accounts"
        >
          <div className="flex items-center">
            <span className="truncate text-sm font-semibold text-white">{profileName}</span>
          </div>
          <p className="truncate text-xs font-medium text-[#c6d7df]">
            {sessionUser?.email || "Currently active"}
          </p>
        </div>

        <ChevronDown size={17} className={`shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
      </button>

      {menuOpen && (
        <div className="theme-card absolute bottom-[calc(100%+14px)] left-0 z-30 w-full rounded-[28px] p-5">
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleAddAccount}
              className="flex w-full items-center gap-4 rounded-2xl px-2 py-1.5 text-left text-sm font-semibold text-[#173847] transition hover:bg-white/55"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-[#1f5f7a] shadow-[0_10px_20px_rgba(19,52,72,0.06)]">
                <UserPlus size={16} />
              </span>
              <span>Add another account</span>
            </button>

            <button
              type="button"
              onClick={() => showCard("editProfile")}
              className="flex w-full items-center gap-4 rounded-2xl px-2 py-1.5 text-left text-sm font-semibold text-[#173847] transition hover:bg-white/55"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-[#1f5f7a] shadow-[0_10px_20px_rgba(19,52,72,0.06)]">
                <UserCog size={16} />
              </span>
              <span>Edit profile</span>
            </button>

            <button
              type="button"
              onClick={() => showCard("password")}
              className="flex w-full items-center gap-4 rounded-2xl px-2 py-1.5 text-left text-sm font-semibold text-[#173847] transition hover:bg-white/55"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-[#1f5f7a] shadow-[0_10px_20px_rgba(19,52,72,0.06)]">
                <KeyRound size={16} />
              </span>
              <span>Change password</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-4 rounded-2xl px-2 py-1.5 text-left text-sm font-semibold text-[#173847] transition hover:bg-white/55"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-[#1f5f7a] shadow-[0_10px_20px_rgba(19,52,72,0.06)]">
                <LogOut size={16} />
              </span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {sidebarPhotoOpen && (
        <div className="theme-card absolute bottom-[calc(100%+10px)] left-0 z-50 w-full min-w-[260px] rounded-[24px] p-3">
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleOpenCamera}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#173847] transition hover:bg-white/55"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1f5f7a]">
                <Camera size={16} />
              </span>
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#173847] transition hover:bg-white/55"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1f5f7a]">
                <FolderUp size={16} />
              </span>
              <span>Files</span>
            </button>
          </div>

          {pendingAvatarUrl && !activeCard ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[rgba(98,125,141,0.16)] bg-white/55 p-3">
              <img
                src={pendingAvatarUrl}
                alt="Selected profile"
                className="h-11 w-11 rounded-full object-cover"
              />
              <p className="min-w-0 flex-1 text-xs font-semibold text-[#647c8a]">
                Photo selected
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handlePhotoUpload}
            disabled={!pendingAvatarUrl}
            className="theme-button-primary mt-3 w-full rounded-2xl px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            Upload
          </button>
        </div>
      )}

      {accountSwitcherOpen && (
        <div className="theme-card absolute bottom-[calc(100%+10px)] left-0 z-50 w-full min-w-[260px] rounded-[26px] p-3">
          <div className="px-2 py-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d8593]">
              Saved Accounts
            </p>
          </div>

          <div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto pr-1">
            {savedAccounts.length > 0 ? (
              savedAccounts.map((account) => {
                const normalizedAccount = normalizeAccount(account);
                const initials = getSessionUserInitials({
                  displayName: normalizedAccount.name,
                });
                const isActive =
                  normalizedAccount.email === sessionUser?.email &&
                  normalizedAccount.name === profileName;

                return (
                  <button
                    key={`${normalizedAccount.email}-${normalizedAccount.name}`}
                    type="button"
                    onClick={() => handleAccountSwitch(normalizedAccount)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                      isActive ? "bg-white/70" : "hover:bg-white/55"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-[linear-gradient(145deg,#fff9fd_0%,#f5ecff_100%)] text-sm font-bold text-[#1f5f7a]">
                      {normalizedAccount.avatarUrl ? (
                        <img
                          src={normalizedAccount.avatarUrl}
                          alt={normalizedAccount.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#12303f]">
                        {normalizedAccount.name}
                      </span>
                      <span className="block truncate text-xs font-medium text-[#647c8a]">
                        {normalizedAccount.email || "No email added"}
                      </span>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => handleDeleteAccount(event, normalizedAccount)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleDeleteAccount(event, normalizedAccount);
                        }
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#647c8a] transition hover:bg-white/70 hover:text-[#12303f]"
                      aria-label={`Delete ${normalizedAccount.name}`}
                    >
                      <X size={16} />
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="rounded-2xl bg-white/55 px-3 py-4 text-sm font-semibold text-[#647c8a]">
                No saved accounts yet.
              </p>
            )}
          </div>
        </div>
      )}

      {activeCard && createPortal(
        <div
          className="pointer-events-none fixed inset-0 z-[90] px-4 pb-8 pt-4"
          onClick={() => {
            setActiveCard("");
            setMessage("");
            setPhotoMenuOpen(false);
            setPendingAvatarUrl("");
            stopCamera();
          }}
        >
          <div
            className="profile-action-card pointer-events-auto theme-card fixed max-h-[calc(100vh-32px)] overflow-y-auto rounded-[28px] p-6"
            ref={actionCardRef}
            style={{
              left: `${actionCardPosition?.left ?? 16}px`,
              top: `${actionCardPosition?.top ?? 16}px`,
              width: `${actionCardPosition?.width ?? 430}px`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-[#12303f]">
                  {activeCard === "password"
                    ? "Change Password"
                    : activeCard === "addAccount"
                      ? "Add Account"
                      : "Edit Profile"}
                </h2>
                <p className="mt-1 text-sm font-medium text-[#647c8a]">
                  {activeCard === "password"
                    ? "Update your account password."
                    : activeCard === "addAccount"
                      ? "Add another account to this session."
                  : "Update your visible account details."}
                </p>
              </div>
            </div>

            {activeCard === "password" ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-[#355465]">Old Password</span>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(event) => setPasswordForm((form) => ({ ...form, oldPassword: event.target.value }))}
                    className="theme-input mt-2 w-full rounded-2xl px-5 py-3 text-sm font-medium text-[#12303f] outline-none"
                    placeholder="Old Password"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[#355465]">New Password</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((form) => ({ ...form, newPassword: event.target.value }))}
                    className="theme-input mt-2 w-full rounded-2xl px-5 py-3 text-sm font-medium text-[#12303f] outline-none"
                    placeholder="New Password"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[#355465]">Confirm Password</span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((form) => ({ ...form, confirmPassword: event.target.value }))}
                    className="theme-input mt-2 w-full rounded-2xl px-5 py-3 text-sm font-medium text-[#12303f] outline-none"
                    placeholder="Confirm Password"
                    required
                  />
                </label>
                <button type="submit" className="theme-button-primary w-full rounded-2xl px-5 py-3 text-sm font-bold text-white" disabled={isSaving}>
                  {isSaving ? "Updating..." : "Update Password"}
                </button>
              </form>
            ) : activeCard === "addAccount" ? (
              <form onSubmit={handleAddAccountSubmit} className="space-y-5">
                <label className="block">
                  <span className="text-sm font-semibold text-[#355465]">Name</span>
                  <input
                    type="text"
                    value={addAccountForm.name}
                    onChange={(event) => setAddAccountForm((form) => ({ ...form, name: event.target.value }))}
                    className="theme-input mt-3 w-full rounded-2xl px-5 py-3 text-sm font-medium text-[#12303f] outline-none"
                    placeholder="Name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[#355465]">Email</span>
                  <input
                    type="email"
                    value={addAccountForm.email}
                    onChange={(event) => setAddAccountForm((form) => ({ ...form, email: event.target.value }))}
                    className="theme-input mt-3 w-full rounded-2xl px-5 py-3 text-sm font-medium text-[#12303f] outline-none"
                    placeholder="Email"
                    required
                  />
                </label>
                <button type="submit" className="theme-button-primary w-full rounded-2xl px-5 py-3 text-sm font-bold text-white">
                  Add Account
                </button>
              </form>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-3">
                <div className="flex flex-col items-center gap-2 border-b border-[rgba(98,125,141,0.16)] pb-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoMenuOpen((open) => !open);
                      }}
                      className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-[linear-gradient(145deg,#fff9fd_0%,#f5ecff_100%)] text-[#1f5f7a] shadow-[0_12px_22px_rgba(9,30,43,0.12)]"
                      aria-label="Choose profile photo"
                    >
                      <ProfileAvatar
                        avatarUrl={pendingAvatarUrl || sessionUser?.avatarUrl}
                        alt={profileName}
                        initials={profileInitials}
                        imageClassName="h-full w-full object-cover"
                        textClassName="text-lg font-bold"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMenuOpen((open) => !open)}
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#0f7c82] text-white shadow-[0_8px_16px_rgba(9,30,43,0.18)]"
                      aria-label="Choose profile photo"
                    >
                      <ImagePlus size={16} />
                    </button>

                    {photoMenuOpen ? (
                      <div className="theme-card absolute left-[calc(100%+10px)] top-0 z-10 w-[180px] rounded-[20px] p-2">
                        <button
                          type="button"
                          onClick={handleOpenCamera}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#173847] transition hover:bg-white/55"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1f5f7a]">
                            <Camera size={16} />
                          </span>
                          <span>Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#173847] transition hover:bg-white/55"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1f5f7a]">
                            <FolderUp size={16} />
                          </span>
                          <span>Files</span>
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    disabled={!pendingAvatarUrl}
                    className="theme-button-primary w-full rounded-2xl px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    Upload
                  </button>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-[#355465]">Name</span>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))}
                    className="theme-input mt-2 w-full rounded-2xl px-5 py-3 text-sm font-medium text-[#12303f] outline-none"
                    placeholder="Name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[#355465]">Email</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))}
                    className="theme-input mt-2 w-full rounded-2xl px-5 py-3 text-sm font-medium text-[#12303f] outline-none"
                    placeholder="Email"
                    required
                  />
                </label>
                <button type="submit" className="theme-button-primary w-full rounded-2xl px-5 py-3 text-sm font-bold text-white" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Edit Profile"}
                </button>
              </form>
            )}

            {message ? <p className="mt-4 text-sm font-semibold text-[#1f5f7a]">{message}</p> : null}
          </div>
        </div>,
        document.body
      )}

      {cameraOpen ? createPortal(
        <div className="fixed inset-0 z-[120] bg-[#06151d] text-white">
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => {
                setPendingAvatarUrl("");
                stopCamera();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
              aria-label="Close camera"
            >
              <X size={22} />
            </button>

            <button
              type="button"
              onClick={handleCameraDone}
              disabled={!pendingAvatarUrl}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-[#12303f] shadow-[0_12px_28px_rgba(0,0,0,0.24)] transition hover:bg-[#f2fbfc] disabled:cursor-not-allowed disabled:opacity-55"
            >
              Done
            </button>
          </div>

          {pendingAvatarUrl ? (
            <img
              src={pendingAvatarUrl}
              alt="Captured profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
          )}

          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center px-4 pb-8 pt-4">
            {pendingAvatarUrl ? (
              <button
                type="button"
                onClick={handleOpenCamera}
                className="rounded-full bg-black/45 px-6 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-black/65"
              >
                Retake
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/85 bg-white/25 shadow-[0_18px_34px_rgba(0,0,0,0.28)] backdrop-blur transition hover:bg-white/35"
                aria-label="Capture photo"
              >
                <span className="h-14 w-14 rounded-full bg-white" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>,
        document.body
      ) : null}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
    </div>
  );
};

export default SidebarProfile;
