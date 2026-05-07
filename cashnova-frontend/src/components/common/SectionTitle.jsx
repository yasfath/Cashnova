const SectionTitle = ({ title, subtitle }) => {
  return (
    <div className="mb-5">
      <h2 className="text-[18px] font-bold text-[#24163B]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-[#8C79B0]">{subtitle}</p> : null}
    </div>
  );
};

export default SectionTitle;
