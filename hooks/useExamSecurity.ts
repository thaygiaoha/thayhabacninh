import { useEffect, useRef } from "react";

interface SecurityOptions {
  forceFullscreen?: boolean;
  blockCopy?: boolean;
  blockDevTools?: boolean;
  maxViolations?: number;
  onAutoSubmit?: () => void;   // callback nộp bài
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

  const violations = useRef(0);

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
          time: new Date().toISOString()
        })
      });
    } catch {}
  };

  const handleViolation = (msg: string, type: string) => {

    violations.current++;

    logViolation(type);

    alert(`${msg}\nVi phạm ${violations.current}/${maxViolations}`);

    if (violations.current >= maxViolations) {

      alert("Bạn đã vi phạm quá số lần cho phép. Hệ thống sẽ tự nộp bài.");

      if (onAutoSubmit) onAutoSubmit();
    }

  };

  /* =========================
     FULLSCREEN
  ========================= */

  useEffect(() => {

    if (!forceFullscreen) return;

    const requestFull = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(()=>{});
      }
    };

    const start = () => {
      requestFull();
      document.removeEventListener("click", start);
    };

    document.addEventListener("click", start);

    const exitHandler = () => {
      if (!document.fullscreenElement) {
        handleViolation(
          "Không được thoát toàn màn hình khi đang làm bài!",
          "exit_fullscreen"
        );
        requestFull();
      }
    };

    document.addEventListener("fullscreenchange", exitHandler);

    return () => {
      document.removeEventListener("click", start);
      document.removeEventListener("fullscreenchange", exitHandler);
    };

  }, []);


  /* =========================
     CHỐNG COPY
  ========================= */

  useEffect(() => {

    if (!blockCopy) return;

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
    };

  }, []);


  /* =========================
     CHỐNG DEVTOOLS
  ========================= */

  useEffect(() => {

    if (!blockDevTools) return;

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

    if (!blockDevTools) return;

    const detect = () => {

      const threshold = 160;

      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        handleViolation("Phát hiện DevTools!", "devtools_open");
      }

    };

    const interval = setInterval(detect, 2000);

    return () => clearInterval(interval);

  }, []);


  /* =========================
     CHUYỂN TAB
  ========================= */

  useEffect(() => {

    const visibilityHandler = () => {

      if (document.hidden) {
        handleViolation(
          "Không được chuyển tab khi đang làm bài!",
          "tab_switch"
        );
      }

    };

    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      document.removeEventListener("visibilitychange", visibilityHandler);
    };

  }, []);


  /* =========================
     CHỐNG NHIỀU TAB
  ========================= */

  useEffect(() => {

    const key = "exam_tab_lock";

    if (localStorage.getItem(key)) {

      alert("Bài thi đã được mở ở tab khác!");
      window.close();

    }

    localStorage.setItem(key, "active");

    return () => {
      localStorage.removeItem(key);
    };

  }, []);


  /* =========================
     CHỐNG CHỤP MÀN HÌNH (một phần)
  ========================= */

  useEffect(() => {

    const detectPrintScreen = (e: KeyboardEvent) => {

      if (e.key === "PrintScreen") {

        navigator.clipboard.writeText("Screenshot blocked");

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

}
