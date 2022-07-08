import React, { useEffect, useState } from 'react';
import { Stack, Text, Persona } from '@fluentui/react';
import { SimpleUser, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const Teachers = (props: { info: User; }) => {

    const { t } = useTranslation();

    const [teachers, setTeachers] = useState<SimpleUser[]>([]);
    
    useEffect(() => {
        setTeachers(props.info?.avaliable.filter(x => x.type === 'Teacher').sort((a, b) => a.name.localeCompare(b.name)));
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