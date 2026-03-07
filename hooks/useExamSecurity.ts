import { useEffect } from "react";

interface SecurityOptions {
  forceFullscreen?: boolean;
  blockCopy?: boolean;
  blockDevTools?: boolean;
}

export default function useExamSecurity({
  forceFullscreen = true,
  blockCopy = true,
  blockDevTools = true
}: SecurityOptions = {}) {

  useEffect(() => {

    /* =========================
       1. BẮT FULLSCREEN
    ========================= */

    const requestFull = () => {
      const el = document.documentElement;

      if (!document.fullscreenElement) {
        el.requestFullscreen().catch(() => {});
      }
    };

    if (forceFullscreen) {
      requestFull();

      const exitHandler = () => {
        if (!document.fullscreenElement) {
          alert("Không được thoát chế độ toàn màn hình khi đang làm bài!");
          requestFull();
        }
      };

      document.addEventListener("fullscreenchange", exitHandler);

      return () => {
        document.removeEventListener("fullscreenchange", exitHandler);
      };
    }

  }, []);


  useEffect(() => {

    /* =========================
       2. CHỐNG COPY
    ========================= */

    if (!blockCopy) return;

    const prevent = (e: Event) => e.preventDefault();

    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
    };

  }, []);


  useEffect(() => {

    /* =========================
       3. CHỐNG F12 / DEVTOOLS
    ========================= */

    if (!blockDevTools) return;

    const keyHandler = (e: KeyboardEvent) => {

      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        alert("Chức năng này bị khóa trong chế độ thi!");
      }

    };

    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("keydown", keyHandler);
    };

  }, []);

}
