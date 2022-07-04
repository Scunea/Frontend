import React, { useEffect, useState } from 'react';
import { Stack, Image, Text, TextField, PrimaryButton, Persona, DefaultButton, IconButton } from '@fluentui/react';
import { SharedColors } from '@fluentui/theme';
import logo from './Logo.svg';
import './animation.css';
import { School } from './interfaces';
import { useTranslation } from 'react-i18next';

const Login = (props: { domain: string | undefined; }) => {

    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [schools, setSchools] = useState<School[]>([]);
    const [displayError, setDisplayError] = useState(false);

    useEffect(() => {
        document.body.classList.add('loginBody');

        return () => {
            document.body.classList.remove('loginBody');
        };
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetch(props.domain + '/loginByToken', {
                method: 'POST',
                body: JSON.stringify({
                    token: localStorage.getItem('token')
                }),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(res => res.json()).then(json => {
                    if (json?.token) {
                        setToken(json.token);
                        setSchools(json.schools);
                    } else {
                        localStorage.removeItem('token');
                    }
                });
        }
    }, []);

    const { t } = useTranslation();

    return (
        <Stack styles={{
            root: {
                backgroundColor: 'white',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center'
            }
        }}>
            <Stack styles={{
                root: {
                    position: 'relative',
                    width: 500,
                    minHeight: 450,
                    border: '1px solid black',
                    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)',
                    paddingBottom: 50,
                    backgroundColor: 'white',
                    zIndex: 1
                }
            }} tokens={{
                childrenGap: 25
            }}>
                <Stack.Item>
                    {token ? <IconButton iconProps={{ iconName: 'Back' }} onClick={() => {
                        localStorage.removeItem('token');
                        setToken('');
                    }}></IconButton> : <div style={{
                        height: 32
                    }}></div>}
                </Stack.Item>
                <Stack.Item>
                    <Image src={logo} alt="logo" className="loginLogo" styles={{
                        root: {
                            width: 104,
                            height: 20,
                            marginLeft: 50
                        }
                    }} />
                </Stack.Item>
                <Stack.Item>
                    <Text variant='xLargePlus' styles={{
                        root: {
                            marginLeft: 50
                        }
                    }}>{!token ? t('Sign in') : t('Choose a school')}</Text>
                </Stack.Item>
                {!token ? <>
                    <Stack.Item>
                        <TextField placeholder="ID" styles={{
                            root: {
                                marginLeft: 50,
                                marginRight: 50
                            }
                        }} underlined onChange={(event, value) => {
                            setId(value ?? '');
                        }}></TextField>
                    </Stack.Item>
                    <Stack.Item>
                        <TextField placeholder={t('Password')} styles={{
                            root: {
                                marginLeft: 50,
                                marginRight: 50
                            }
                        }} type="password" underlined onChange={(event, value) => {
                            setPassword(value ?? '');
                        }}></TextField>
                    </Stack.Item>
                    <Stack.Item styles={{
                        root: {
                            textAlign: 'center',
                            display: displayError ? 'inline-block' : 'none'
                        }
                    }}>
                        <Text styles={{
                            root: {
                                color: SharedColors.red10
                            }
                        }}>{t('Something went wrong signing you in.')}</Text>
                    </Stack.Item>
                    <Stack.Item>
                        <PrimaryButton text={t('Next')} styles={{
                            root: {
                                position: 'absolute',
                                right: 25,
                                bottom: 25
                            }
                        }} onClick={() => {
                            fetch(props.domain + '/login', {
                                method: 'POST',
                                body: JSON.stringify({
                                    id: id,
                                    password: password
                                }),
                                headers: new Headers({
                                    'Content-Type': 'application/json'
                                })
                            })
                                .then(res => res.json()).then(json => {
                                    if (json?.token) {
                                        localStorage.setItem('token', json.token);
                                        setToken(json.token);
                                        setSchools(json.schools);
                                    } else {
                                        setDisplayError(true);
                                    }
                                });
                        }} />
                    </Stack.Item>
                </> : schools.map(school => <DefaultButton key={school.id} styles={{
                    root: {
                        marginLeft: 50,
                        marginRight: 50,
                        minHeight: 75,
                        display: 'flex'
                    }
                }} onClick={() => {
                    localStorage.setItem('token', token);
                    localStorage.setItem('schoolId', school.id);
                    window.location.reload();
                }}><Persona {...{
                    text: school.name
                }} /></DefaultButton>)}
            </Stack>
            <Stack>
                <Stack.Item className="circle1"> </Stack.Item>
                <Stack.Item className="circle2"> </Stack.Item>
                <Stack.Item className="circle3"> </Stack.Item>
            </Stack>
        </Stack>
    );
};

export default Login;