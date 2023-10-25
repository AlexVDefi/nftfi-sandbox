import Image from 'next/image';
import type { ReactNode } from 'react';

type IMainProps = {
  meta?: ReactNode;
  children: ReactNode;
};

const Main = (props: IMainProps) => (
  <div className="w-full antialiased">
    {props.meta}
    <main className="relative z-20 py-5">{props.children}</main>
    <Image
      src="/assets/images/background-desktop.jpg"
      alt="background"
      width={1920}
      height={1080}
      className="fixed top-0 z-10 h-full w-full object-cover"
    />
  </div>
);

export { Main };
