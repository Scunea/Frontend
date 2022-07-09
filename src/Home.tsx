import React from 'react';
import { Persona, PersonaSize, Stack, Text } from '@fluentui/react';
import { useTranslation } from 'react-i18next';
import { User } from './interfaces';

const Home = (props: { domain: string | undefined; info: User; }) => {
    const { t } = useTranslation();

    return (
        <Stack horizontalAlign='center' styles={{
            root: {
                padding: 25,
                textAlign: 'center'
            }
        }}>
            <Stack.Item>
                <Text variant='xxLarge' styles={{
                    root: {
                        fontWeight: 'bold'
                    }
                }}>{t('Welcome to Scunea!')}</Text>
            </Stack.Item>
            <Stack.Item styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                <Text variant='large'>{t('Start by choosing an option from the menu at the left.')}</Text>
            </Stack.Item>
            <Stack.Item>
                <Persona {...{
                    text: props.info?.schoolName,
                    size: PersonaSize.size100,
                    imageUrl: props.info?.schoolLogo ? props.domain + '/static/' + props.info?.schoolLogo : undefined
                }} />
            </Stack.Item>
        </Stack>
    );
};

export default Home;