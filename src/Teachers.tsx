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

import React, { useEffect, useState } from 'react';
import { Stack, Text, Persona } from '@fluentui/react';
import { SimpleUser, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const Teachers = (props: { info: User; }) => {

    const { t } = useTranslation();

    const [teachers, setTeachers] = useState<SimpleUser[]>([]);

    useEffect(() => {
        setTeachers(props.info?.available.filter(x => x.type === 'teacher').sort((a, b) => a.name.localeCompare(b.name)));
    }, [props.info]);

    return (
        <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Stack.Item>
                <Text variant="xxLarge">{t('Teachers')}</Text>
            </Stack.Item>
            {teachers.length > 0 ? teachers.map((teacher, i) => <Persona key={i} {...{
                text: teacher.name,
                secondaryText: teacher.teacher
            }} styles={{
                root: {
                    marginTop: '25px !important'
                }
            }} />) : <Text styles={{
                root: {
                    marginTop: '25px !important'
                }
            }}>No teachers!</Text>}
        </Stack>
    );
};

export default Teachers;
