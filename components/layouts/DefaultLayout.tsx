import React from "react";
import DefaultFooter from "../modules/footers/DefaultFooter";
import DefaultSidebar from "../modules/sidebars/DefaultSidebar";

type Props = {
  children: React.ReactNode;
  serverKeyConfigured: boolean;
};

const DefaultLayout = ({ children, serverKeyConfigured }: Props) => {
  return (
    <DefaultSidebar serverKeyConfigured={serverKeyConfigured}>
      {children}
      <DefaultFooter />
    </DefaultSidebar>
  );
};

export default DefaultLayout;
