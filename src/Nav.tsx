import React, { useEffect } from 'react';
import { Nav } from '@fluentui/react';
import { User } from './interfaces';
import { useTranslation } from 'react-i18next';

const NavF = (props: { info: User; selected: string; setSelected: (value: React.SetStateAction<string>) => void; }) => {

  useEffect(() => {
    window.addEventListener('hashchange', () => {
      props.setSelected(document.location.hash.split('?')[0].slice(1));
    });
  }, []);

  const { t } = useTranslation();

  return (<Nav selectedKey={props.selected.length > 0 ? props.selected : 'home'} groups={[
    {
      links: [
        {

          key: 'home',
          name: t('Home'),
          icon: 'Home',
          url: '#home'
        },
        {
          key: 'schedule',
          name: t('Schedule'),
          icon: 'Calendar',
          url: '#schedule'
        },
        {
          key: 'grades',
          name: t('Grades'),
          icon: 'FavoriteStar',
          url: '#grades'
        },
        {
          key: 'messages',
          name: t('Messages'),
          icon: 'Chat',
          url: '#messages'
        },
        {
          key: 'reports',
          name: t('Reports'),
          icon: 'ReportDocument',
          url: '#reports'
        },
        {
          key: 'teachers',
          name: t('Teachers'),
          icon: 'People',
          url: '#teachers'
        },
        {
          key: 'activities',
          name: t('Activities'),
          icon: 'Edit',
          url: '#activities'
        },
        {
          key: 'administration',
          name: t('Administration'),
          icon: 'Admin',
          url: '#administration',
          disabled: !props.info?.administrator
        },
        {
          key: 'github',
          name: 'GitHub',
          icon: 'GitGraph',
          url: 'https://www.example.org',
          target: '_blank'
        },
      ]
    }
  ]} styles={{
    root: {
      width: 200
    },
  }} />);

};

export default NavF;