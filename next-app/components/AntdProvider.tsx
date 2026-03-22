"use client";

import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, App, theme } from "antd";
import type { FC, PropsWithChildren } from "react";
import " @ant-design/v5-patch-for-react-19";

interface AntdProviderProps extends PropsWithChildren {
  darkMode?: boolean;
}

const AntdProvider: FC<AntdProviderProps> = ({ children, darkMode = false }) => {
  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={{
          cssVar: true,
          hashed: false,
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </StyleProvider>
  );
};

export default AntdProvider;
