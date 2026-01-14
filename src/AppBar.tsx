// src/components/AppBar.tsx
import { AppBar as KendoAppBar, AppBarSection, AppBarSpacer } from '@progress/kendo-react-layout';
import { HeaderProfile, MinimunEntityLevel } from '@nasajon/erprompt-login-lib';
import { Button } from '@progress/kendo-react-buttons';
import { menuIcon } from '@progress/kendo-svg-icons';
//import appLogo from '../assets/styles/images/locacoes_logo.svg';

type AppBarProps = {
  onMenuClick: () => void;
};

export const AppBar = ({ onMenuClick }: AppBarProps) => {
  return (
    <header className="app-bar">
      <KendoAppBar className="app-bar">
        <AppBarSection>
          <Button
            svgIcon={menuIcon}
            onClick={(e) => {
              e.currentTarget.blur();
              onMenuClick();
            }}
            style={{ backgroundColor: 'var(--bgnd-color)', border: 'none', boxShadow: 'none' }}
          />
          <h2>CT-e Web</h2>
          {
          //<img src={appLogo} alt="Logo" className="app-logo" style={{ marginLeft: '1rem', marginTop: '.5rem' }} />
          }
        </AppBarSection>
        <AppBarSpacer />
        <AppBarSection>
          <HeaderProfile />
        </AppBarSection>
      </KendoAppBar>
    </header>
  );
};
