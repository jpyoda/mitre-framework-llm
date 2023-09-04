import React from "react";
import DefaultFooter from "../modules/footers/DefaultFooter";
import DefaultSidebar from "../modules/sidebars/DefaultSidebar";

type Props = {
  children: React.ReactNode;
};

const DefaultLayout = ({ children }: Props) => {
  return (
    <DefaultSidebar>
      {children}
      <DefaultFooter />
    </DefaultSidebar>
  );
};

export default DefaultLayout;
