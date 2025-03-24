import { LogoClostechCarga } from "../../../../public/logo";
import PropTypes from "prop-types";


export const ModalLoading = () => {
  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-black bg-opacity-80 z-50"
      style={{ zIndex: 1000 }}
    >
      {" "}
      <LogoClostechCarga className={"animate-pulse"} />
    </div>
  );
};


interface ModalLoadingLogoClostechProps {
  label: string;
}

export const ModalLoadingLogoClostech: React.FC<
  ModalLoadingLogoClostechProps
> = ({ label }) => {
  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen flex flex-col justify-center items-center bg-black bg-opacity-80 z-50"
      style={{ zIndex: 1000 }}
    >
      <LogoClostechCarga className={"animate-pulse"} />
      <h2 className="text-center mt-5 text-txtWhite font-semibold text-2xl animate-pulse">
        {label}
      </h2>
    </div>
  );
};

ModalLoadingLogoClostech.propTypes = {
  label: PropTypes.string.isRequired,
};
