/*
This file is part of Scunea.
Copyright (C) 2025  Mateo Hideg

Scunea is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Scunea is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Scunea.  If not, see <https://www.gnu.org/licenses/>.
*/

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

  return (<Nav selectedKey={props.selected.length > 0 ? props.selected : 'schedule'} groups={[
    {
      links: [
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
          url: 'https://github.com/Scunea',
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
