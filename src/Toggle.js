import { useState } from "react";
import volumeico from "./volume-high-solid.svg";
import volumeoffico from "./volume-xmark-solid.svg";

export const Toggle = ({ label, toggled, onClick }) => {
  const [isToggled, toggle] = useState(toggled);

  const callback = () => {
    toggle(!isToggled);
    onClick(!isToggled);
  };

  const getEndOfLabel = () => (isToggled ? label + " Off" : label + " On");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <img
        src={!isToggled ? volumeico : volumeoffico}
        alt="Volume Icon"
        onClick={callback}
      />
      {getEndOfLabel()}
    </div>
  );
};
