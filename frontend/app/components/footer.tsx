import Logo from './logo';

const Footer = () => {
  return (
    <footer className="px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 max-[309px]:flex-col max-[309px]:gap-1 max-[309px]:text-center">
        <span className="text-xl text-[#7987A0]">Designed by</span>
        <Logo className="h-10" />
      </div>
    </footer>
  );
};

export default Footer;