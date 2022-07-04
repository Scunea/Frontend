import React from 'react';
import { Stack, Text } from '@fluentui/react';
import { useTranslation } from 'react-i18next';

const Home = () => {
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
            <Stack.Item>
                <Text variant='large'>{t('Start by choosing an option from the menu at the left.')}</Text>
            </Stack.Item>
        </Stack>
    );
};

export default Home;