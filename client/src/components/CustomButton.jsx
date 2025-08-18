const CustomButton = ({ title, containerStyles, iconRight, type, onClick }) => {
  return (
    <button
      onClick={onClick}
      type={type || "button"}
      className={`inline-flex items-center text-sm ${containerStyles}`}
      style={{ color: "white" }}
    >
      {title}
      {iconRight && (
        <div className="ml-2 text-white text-base">{iconRight}</div>
      )}
    </button>
  );
};

export default CustomButton;