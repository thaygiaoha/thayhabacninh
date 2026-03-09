import { useEffect, useRef } from "react";

interface SecurityOptions {
  forceFullscreen?: boolean;
  blockCopy?: boolean;
  blockDevTools?: boolean;
  maxViolations?: number;
  onAutoSubmit?: () => void;
  studentId?: string;
}

export default function useExamSecurity({
  forceFullscreen = true,
  blockCopy = true,
  blockDevTools = true,
  maxViolations = 3,
  onAutoSubmit,
  studentId
}: SecurityOptions = {}) {

  const lastType = useRef<string | null>(null);
  const startTime = useRef(Date.now());
  const violations = useRef(0);
  const devtoolsOpened = useRef(false);
  const alertLock = useRef(false);

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* =========================
     LOG SERVER
  ========================= */

  const logViolation = async (type: string) => {
    try {
      await fetch("/api/exam/violation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId,
          type,
          time: new Date().toISOString(),
          userAgent: navigator.userAgent,
          width: window.innerWidth,
          height: window.innerHeight
        })
      });
    } catch {}
  };

  /* =========================
     HANDLE VIOLATION
  ========================= */

  const handleViolation = (msg: string, type: string) => {

    if (lastType.current === type) return;
    lastType.current = type;
    setTimeout(() => (lastType.current = null), 1000);

    if (Date.now() - startTime.current < 3000) return;

    if (alertLock.current) return;
    alertLock.current = true;

    setTimeout(() => {
      alertLock.current = false;
    }, 1500);

    violations.current++;

    logViolation(type);

    alert(`${msg}\nVi phạm ${violations.current}/${maxViolations}`);

    if (violations.current >= maxViolations) {
      alert("Bạn đã vi phạm quá số lần cho phép. Hệ thống sẽ tự nộp bài.");
      onAutoSubmit?.();
    }
  };

  /* =========================
     FULLSCREEN
  ========================= */

  useEffect(() => {

    if (!forceFullscreen) return;

    const requestFull = () => {

      if (document.fullscreenElement) return;

      const el: any = document.documentElement;

      if (el.requestFullscreen) {
        el.requestFullscreen().catch(()=>{});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }

    };

    const start = () => {
      requestFull();
      document.removeEventListener("click", start);
      document.removeEventListener("keydown", start);
    };

    document.addEventListener("click", start);
    document.addEventListener("keydown", start);

    const fsHandler = () => {

      if (document.hidden) return;

      if (!document.fullscreenElement) {

        handleViolation(
          "Không được thoát toàn màn hình khi đang làm bài!",
          "exit_fullscreen"
        );

        requestFull();

      }

    };

    document.addEventListener("fullscreenchange", fsHandler);
    document.addEventListener("webkitfullscreenchange", fsHandler as any);

    return () => {
      document.removeEventListener("click", start);
      document.removeEventListener("keydown", start);
      document.removeEventListener("fullscreenchange", fsHandler);
      document.removeEventListener("webkitfullscreenchange", fsHandler as any);
    };

  }, []);

  /* =========================
     CHỐNG COPY
  ========================= */

  useEffect(() => {

    if (!blockCopy || isMobile) return;

    const prevent = (e: Event) => e.preventDefault();

    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);

    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
      document.body.style.userSelect = "";
    };

  }, []);

  /* =========================
     CHỐNG DEVTOOLS KEY
  ========================= */

  useEffect(() => {

    if (!blockDevTools || isMobile) return;

    const keyHandler = (e: KeyboardEvent) => {

      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        handleViolation("Chức năng này bị khóa!", "devtools_key");
      }

    };

    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("keydown", keyHandler);
    };

  }, []);

  /* =========================
     PHÁT HIỆN DEVTOOLS
  ========================= */

  useEffect(() => {

    if (!blockDevTools || isMobile) return;

    const detect = () => {

      const threshold = 200;

      const opened =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;

      if (opened && !devtoolsOpened.current) {

        devtoolsOpened.current = true;

        handleViolation(
          "Phát hiện DevTools!",
          "devtools_open"
        );

      }

      if (!opened) devtoolsOpened.current = false;

    };

    const interval = setInterval(detect, 2000);

    return () => clearInterval(interval);

  }, []);

  /* =========================
     CHỐNG SCREENSHOT
  ========================= */

  useEffect(() => {

    if (isMobile) return;

    const detectPrintScreen = (e: KeyboardEvent) => {

      if (e.key === "PrintScreen") {

        try {
          navigator.clipboard.writeText("");
        } catch {}

        handleViolation(
          "Không được chụp màn hình bài thi!",
          "screenshot"
        );

      }

    };

    document.addEventListener("keyup", detectPrintScreen);

    return () => {
      document.removeEventListener("keyup", detectPrintScreen);
    };

  }, []);

  /* =========================
     PHÁT HIỆN RỜI TAB
  ========================= */

  useEffect(() => {

    const visibilityHandler = () => {

      if (document.hidden) {

        handleViolation(
          "Bạn vừa rời khỏi cửa sổ bài thi!",
          "tab_hidden"
        );

      }

    };

    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      document.removeEventListener("visibilitychange", visibilityHandler);
    };

  }, []);

  /* =========================
     PHÁT HIỆN NHIỀU MÀN HÌNH
  ========================= */

  useEffect(() => {

    if (isMobile) return;

    const interval = setInterval(() => {

      if (window.screen.availWidth > window.innerWidth + 200) {

        handleViolation(
          "Phát hiện nhiều màn hình!",
          "dual_screen"
        );

      }

    }, 4000);

    return () => clearInterval(interval);

  }, []);

}
