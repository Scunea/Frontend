import React from 'react';
import { Stack, Text, Persona } from '@fluentui/react';
import { User } from './interfaces';
import { useTranslation } from 'react-i18next';

const Teachers = (props: { info: User; }) => {

    const { t } = useTranslation();

    return (
        <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Stack.Item>
                <Text variant="xxLarge">{t('Teachers')}</Text>
            </Stack.Item>
            {props.info?.avaliable.filter(x => x.type === 'Teacher').sort((a, b) => a.name.localeCompare(b.name)).map((teacher, i) => <Persona key={i} {...{
                text: teacher.name,
                secondaryText: teacher.teacher
            }} styles={{
                root: {
                    marginTop: '25px !important'
                }
            }} />)}
        </Stack>
    );
};

export default Teachers;