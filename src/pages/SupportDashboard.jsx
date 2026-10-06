import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ScrollReveal from "../components/ScrollReveal";
import SideNav from "../components/SideNav";
import SupportQuestionsPane from "./SupportQuestionsPane";
import SupportCallbacksPane from "./SupportCallbacksPane";
import SupportActivityPane from "./SupportActivityPane";
import SupportUsersPane from "./SupportUsersPane";
import SupportAffiliatesPane from "./SupportAffiliatesPane";
import { canViewFileActivity } from "../config/fileActivityAccess";
import { canViewAffiliateLinks } from "../config/affiliateAccess";
import "../css/SupportDashboard.css";

const ALL_TABS = [
  { id: "users", label: "Users", enabled: true },
  { id: "activity", label: "File Activity", enabled: true },
  { id: "affiliates", label: "Share", enabled: true },
  { id: "callbacks", label: "Callbacks", enabled: true },
  { id: "questions", label: "Tickets", enabled: true },
];

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isUnassignedTicket(item) {
  const s = String(item?.status || "").toLowerCase();
  if (s === "closed" || s === "answered") return false;
  return !item?.assignedTo;
}

function isUnassignedCallback(item) {
  const s = String(item?.status || "").toLowerCase();
  if (s === "completed") return false;
  return !item?.assignedTo;
}

function TabCount({ total, unassigned }) {
  if (unassigned > 0) {
    return (
      <span
        className="ssd-tab-pill"
        title={`${unassigned} unassigned of ${total}`}
      >
        <span className="ssd-tab-pill-total">{total}</span>
        <span className="ssd-tab-pill-new">{unassigned} new</span>
      </span>
    );
  }
  return <span className="ssd-tab-count">{total}</span>;
}

export default function SupportDashboard() {
  const navigate = useNavigate();
  const userProfile = useSelector((state) => state.userProfile);
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");
  const email = (
    userProfile.email ||
    sessionStorage.getItem("email") ||
    ""
  ).toLowerCase();
  const myId = userProfile.userId || "";

  const isInfomanav = email.includes("infomanav");
  const showFileActivity = canViewFileActivity(email);
  const showAffiliates = canViewAffiliateLinks(email);
  const tabs = useMemo(
    () =>
      ALL_TABS.filter((tab) => {
        if (tab.id === "activity") return showFileActivity;
        if (tab.id === "affiliates") return showAffiliates;
        return true;
      }),
    [showFileActivity, showAffiliates]
  );

  const [activeTab, setActiveTab] = useState("users");
  const [callbacksCount, setCallbacksCount] = useState(0);
  const [callbacksUnassigned, setCallbacksUnassigned] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [questionsUnassigned, setQuestionsUnassigned] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [affiliatesCount, setAffiliatesCount] = useState(0);

  useEffect(() => {
    if (!showFileActivity && activeTab === "activity") {
      setActiveTab("users");
    }
  }, [showFileActivity, activeTab]);

  useEffect(() => {
    if (!showAffiliates && activeTab === "affiliates") {
      setActiveTab("users");
    }
  }, [showAffiliates, activeTab]);

  useEffect(() => {
    if (!isInfomanav) {
      navigate("/Files", { replace: true });
    }
  }, [isInfomanav, navigate]);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const prefetchCounts = useCallback(async () => {
    if (!token || !apiUrl || !isInfomanav) return;
    const today = todayKey();
    const reqs = [
      axios
        .get(`${apiUrl}support/callback-requests`, { headers: authHeaders })
        .then((res) => {
          const list = res.data?.result || [];
          setCallbacksCount(list.length);
          setCallbacksUnassigned(list.filter(isUnassignedCallback).length);
        })
        .catch(() => {}),
      axios
        .get(`${apiUrl}support/questions`, { headers: authHeaders })
        .then((res) => {
          const list = res.data?.result || [];
          setQuestionsCount(list.length);
          setQuestionsUnassigned(list.filter(isUnassignedTicket).length);
        })
        .catch(() => {}),
      axios
        .get(`${apiUrl}support/users/summary`, {
          headers: authHeaders,
          params: { from: today, to: today },
        })
        .then((res) => {
          const summary = res.data?.result || res.data || {};
          setUsersCount(
            Number(summary.activeToday) ||
              Number(summary.totalUsers) ||
              0
          );
        })
        .catch(() => {}),
    ];
    if (showFileActivity) {
      reqs.push(
        axios
          .get(`${apiUrl}support/activity/users`, {
            headers: authHeaders,
            params: { from: today, to: today },
          })
          .then((res) => {
            const users = Array.isArray(res.data?.users) ? res.data.users : [];
            setActivityCount(users.length);
          })
          .catch(() => {})
      );
    }
    if (showAffiliates) {
      reqs.push(
        axios
          .get(`${apiUrl}support/affiliates`, { headers: authHeaders })
          .then((res) => {
            const list = Array.isArray(res.data?.result) ? res.data.result : [];
            setAffiliatesCount(list.length);
          })
          .catch(() => {})
      );
    }
    await Promise.all(reqs);
  }, [
    apiUrl,
    authHeaders,
    token,
    isInfomanav,
    showFileActivity,
    showAffiliates,
  ]);

  useEffect(() => {
    prefetchCounts();
  }, [prefetchCounts]);

  const dutyAgentName = useMemo(() => {
    const fromProfile =
      userProfile.name ||
      [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ");
    if (fromProfile) return fromProfile;
    const local = email.split("@")[0] || "Agent";
    return local
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [userProfile, email]);

  if (!isInfomanav) return null;

  return (
    <div className="ssd-shell">
      <SideNav />
      <div
        className={`ssd-page${
          activeTab === "activity" ||
          activeTab === "users" ||
          activeTab === "affiliates" ||
          activeTab === "callbacks" ||
          activeTab === "questions"
            ? " ssd-page--activity"
            : ""
        }`}
      >
        <ScrollReveal
          as="header"
          className="ssd-header"
          variant="fadeSoft"
          delay={0.05}
          duration={0.75}
        >
          <div className="ssd-header-left">
            <p className="ssd-breadcrumb">
              Team tools <span aria-hidden="true">›</span> Outbound operations
            </p>
            <div className="ssd-title-row">
              <h1 className="ssd-title">Support dashboard</h1>
              <span className="ssd-live-pill">
                <span className="ssd-live-dot" aria-hidden="true" />
                Live queue synced
              </span>
            </div>
          </div>
          <div className="ssd-header-right">
            <div className="ssd-duty-agent">
              <span className="ssd-duty-label">Duty agent</span>
              <div className="ssd-duty-row">
                <strong>{dutyAgentName}</strong>
                <span className="ssd-duty-badge" title="Support level">
                  L2
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal
          as="div"
          className="ssd-chrome"
          variant="fadeUp"
          delay={0.1}
          duration={0.85}
        >
          <div className="ssd-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                disabled={!tab.enabled}
                className={`ssd-tab${activeTab === tab.id ? " is-active" : ""}`}
                onClick={() => {
                  if (!tab.enabled) return;
                  setActiveTab(tab.id);
                }}
                title={tab.enabled ? tab.label : "Coming soon"}
              >
                {tab.label}
                {tab.id === "callbacks" && (
                  <TabCount
                    total={callbacksCount}
                    unassigned={callbacksUnassigned}
                  />
                )}
                {tab.id === "questions" && (
                  <TabCount
                    total={questionsCount}
                    unassigned={questionsUnassigned}
                  />
                )}
                {tab.id === "activity" && (
                  <span className="ssd-tab-count">{activityCount}</span>
                )}
                {tab.id === "users" && (
                  <span className="ssd-tab-count">{usersCount}</span>
                )}
                {tab.id === "affiliates" && (
                  <span className="ssd-tab-count">{affiliatesCount}</span>
                )}
                {!tab.enabled && <span className="ssd-soon">Soon</span>}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {activeTab === "questions" && (
          <div className="ssd-activity-host">
            <ScrollReveal
              as="div"
              className="ssd-callbacks"
              variant="fadeUp"
              delay={0.1}
              duration={0.85}
              style={{
                flex: "1 1 0",
                minHeight: 0,
                maxHeight: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SupportQuestionsPane
                apiUrl={apiUrl}
                authHeaders={authHeaders}
                email={email}
                myId={myId}
                token={token}
                onItemCountChange={setQuestionsCount}
                onUnassignedCountChange={setQuestionsUnassigned}
              />
            </ScrollReveal>
          </div>
        )}

        {activeTab === "callbacks" && (
          <div className="ssd-activity-host">
            <ScrollReveal
              as="div"
              className="ssd-callbacks"
              variant="fadeUp"
              delay={0.1}
              duration={0.85}
              style={{
                flex: "1 1 0",
                minHeight: 0,
                maxHeight: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SupportCallbacksPane
                apiUrl={apiUrl}
                authHeaders={authHeaders}
                email={email}
                myId={myId}
                token={token}
                onItemCountChange={setCallbacksCount}
                onUnassignedCountChange={setCallbacksUnassigned}
              />
            </ScrollReveal>
          </div>
        )}

        {activeTab === "activity" && showFileActivity && (
          <div className="ssd-activity-host">
            <SupportActivityPane
              apiUrl={apiUrl}
              authHeaders={authHeaders}
              onItemCountChange={setActivityCount}
            />
          </div>
        )}

        {activeTab === "users" && (
          <div className="ssd-activity-host">
            <SupportUsersPane
              apiUrl={apiUrl}
              authHeaders={authHeaders}
              agentEmail={email}
              onItemCountChange={setUsersCount}
            />
          </div>
        )}

        {activeTab === "affiliates" && showAffiliates && (
          <div className="ssd-activity-host">
            <SupportAffiliatesPane
              apiUrl={apiUrl}
              authHeaders={authHeaders}
              onItemCountChange={setAffiliatesCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
