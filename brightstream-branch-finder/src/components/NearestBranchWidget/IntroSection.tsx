type IntroSectionProps = {
  onFindNearest: () => void;
};

export default function IntroSection(props: IntroSectionProps) {
  return (
    <>
      <p className="nbw-intro-text">
        Find the nearest branch using GPS, or search branches by city.
      </p>
      <button onClick={props.onFindNearest} className="nbw-action-btn">
        Find Nearest Branch
      </button>
    </>
  );
}
