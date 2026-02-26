type IntroSectionProps = {
  onFindNearest: () => void;
  isLoading: boolean;
};

export default function IntroSection(props: IntroSectionProps) {
  return (
    <>
      <p className="nbw-intro-text ease-up">
        Find the nearest branch from your location using GPS
      </p>
      <button
        onClick={props.onFindNearest}
        className={`nbw-action-btn ease-up${props.isLoading ? " is-loading" : ""}`}
        disabled={props.isLoading}
        aria-busy={props.isLoading}
      >
        {props.isLoading ? "Finding nearest..." : "Find Nearest Branch"}
      </button>
    </>
  );
}
