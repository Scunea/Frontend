import React, { useEffect, useState } from 'react';
import { Stack, Image, Text, TextField, PrimaryButton, Persona, DefaultButton, IconButton, Link, PersonaInitialsColor, MessageBar, MessageBarType } from '@fluentui/react';
import logo from './Logo.svg';
import './animation.css';
import { School } from './interfaces';
import { useTranslation } from 'react-i18next';

const Login = (props: { domain: string | undefined; }) => {

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [signUp, setSignUp] = useState(false);
    const [signedUp, setSignedUp] = useState(false);
    const [createSchool, setCreateSchool] = useState(false);
    const [invites, setInvites] = useState(false);
    const [token, setToken] = useState('');
    const [schools, setSchools] = useState<School[]>([]);
    const [pending, setPending] = useState<School[]>([]);
    const [error, setError] = useState('');

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
                        setPending(json.pending);
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
                    backgroundColor: 'white',
                    zIndex: 1
                }
            }} tokens={{
                childrenGap: 25
            }}>
                <Stack.Item>
                    {token ? <IconButton iconProps={{ iconName: 'Back' }} onClick={() => {
                        if (createSchool) {
                            setCreateSchool(false);
                        } else if (invites) {
                            setInvites(false);
                        } else {
                            localStorage.removeItem('token');
                            setToken('');
                        }
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
                    }}>{!token ? !signUp ? t('Sign in') : t('Sign up') : invites ? t('Join a school') : createSchool ? t('Create a school') : t('Choose a school')}</Text>
                </Stack.Item>
                {!token ? <>
                    <Stack.Item>
                        <TextField placeholder="Email" type="email" styles={{
                            root: {
                                marginLeft: 50,
                                marginRight: 50
                            }
                        }} underlined onChange={(event, value) => {
                            setEmail(value ?? '');
                        }}></TextField>
                    </Stack.Item>
                    {signUp ? <Stack.Item>
                        <TextField placeholder={t('Name')} styles={{
                            root: {
                                marginLeft: 50,
                                marginRight: 50
                            }
                        }} underlined onChange={(event, value) => {
                            setName(value ?? '');
                        }}></TextField>
                    </Stack.Item> : null}
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
                    {signUp ? <Stack.Item>
                        <TextField placeholder={t('Confirm password')} styles={{
                            root: {
                                marginLeft: 50,
                                marginRight: 50
                            }
                        }} type="password" underlined onChange={(event, value) => {
                            setConfirmPassword(value ?? '');
                        }}></TextField>
                    </Stack.Item> : null}
                    <Stack.Item>
                        <Link styles={{
                            root: {
                                marginLeft: 50
                            }
                        }} onClick={() => {
                            setSignUp(!signUp);
                        }}>{!signUp ? t('Sign up') : t('Sign in')}</Link>
                    </Stack.Item>
                    <Stack.Item>
                        {!signUp ? <PrimaryButton disabled={!(email && password)} text={t('Next')} styles={{
                            root: {
                                position: 'absolute',
                                right: 25,
                                bottom: 25
                            },
                            rootDisabled: {
                                position: 'absolute',
                                right: 25,
                                bottom: 25
                            },
                        }} onClick={() => {
                            fetch(props.domain + '/login', {
                                method: 'POST',
                                body: JSON.stringify({
                                    email: email,
                                    password: password
                                }),
                                headers: new Headers({
                                    'Content-Type': 'application/json'
                                })
                            })
                                .then(res => res.json()).then(json => {
                                    if (!json?.error) {
                                        localStorage.setItem('token', json.token);
                                        setToken(json.token);
                                        setSchools(json.schools);
                                    } else {
                                        setError(json.error);
                                    }
                                });
                        }} /> : <PrimaryButton disabled={!(email && name && password && (password === confirmPassword))} text={t('Sign up')} styles={{
                            root: {
                                position: 'absolute',
                                right: 25,
                                bottom: 25
                            },
                            rootDisabled: {
                                position: 'absolute',
                                right: 25,
                                bottom: 25
                            },
                        }} onClick={() => {
                            fetch(props.domain + '/signup', {
                                method: 'POST',
                                body: JSON.stringify({
                                    email: email,
                                    name: name,
                                    password: password
                                }),
                                headers: new Headers({
                                    'Content-Type': 'application/json'
                                })
                            })
                                .then(res => res.json()).then(json => {
                                    if (!json?.error) {
                                        setSignedUp(true);
                                    } else {
                                        setError(json.error);
                                    }
                                });
                        }} />}
                    </Stack.Item>
                </> : signedUp ? null : createSchool ? <>

                    <Stack.Item>
                        <TextField placeholder={t('Name')} styles={{
                            root: {
                                marginLeft: 50,
                                marginRight: 50
                            }
                        }} underlined onChange={(event, value) => {
                            setName(value ?? '');
                        }}></TextField>
                    </Stack.Item>
                    <Stack.Item>
                        <PrimaryButton disabled={!(name)} text={t('Create')} styles={{
                            root: {
                                position: 'absolute',
                                right: 25,
                                bottom: 25
                            },
                            rootDisabled: {
                                position: 'absolute',
                                right: 25,
                                bottom: 25
                            },
                        }} onClick={() => {
                            fetch(props.domain + '/create', {
                                method: 'POST',
                                body: JSON.stringify({
                                    name: name,
                                }),
                                headers: new Headers({
                                    'Authorization': localStorage.getItem('token') ?? "",
                                    'Content-Type': 'application/json'
                                })
                            }).then(res => res.json()).then(json => {
                                if (!json?.error) {
                                    localStorage.setItem('token', token);
                                    localStorage.setItem('schoolId', json.id);
                                    window.location.reload();
                                } else {
                                    setError(json.error);
                                }
                            });
                        }} />
                    </Stack.Item>
                </> : invites ? pending.length > 0 ? pending.map(school => <DefaultButton key={school.id} styles={{
                    root: {
                        marginLeft: 50,
                        marginRight: 50,
                        minHeight: 75,
                        display: 'flex'
                    }
                }} onClick={() => {
                    fetch(props.domain + '/join/' + school.id, {
                        method: 'POST',
                        headers: new Headers({
                            'Authorization': localStorage.getItem('token') ?? "",
                        })
                    }).then(res => res.json()).then(json => {
                        if (!json?.error) {
                            localStorage.setItem('token', token);
                            localStorage.setItem('schoolId', school.id);
                            window.location.reload();
                        } else {
                            setError(json.error);
                        }
                    });
                }}><Persona {...{
                    text: school.name
                }} /></DefaultButton>) : <Text styles={{
                    root: {
                        marginLeft: 50
                    }
                }}>{t('No invites available.')}</Text> : <>
                    {schools.map(school => <DefaultButton key={school.id} styles={{
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
                    <DefaultButton styles={{
                        root: {
                            marginLeft: 50,
                            marginRight: 50,
                            minHeight: 75,
                            display: 'flex'
                        }
                    }} onClick={() => {
                        setCreateSchool(true);
                    }}><Persona {...{
                        text: t('Create a school'),
                        imageInitials: '+',
                        initialsColor: PersonaInitialsColor.blue
                    }} /></DefaultButton>
                    <DefaultButton styles={{
                        root: {
                            marginLeft: 50,
                            marginRight: 50,
                            minHeight: 75,
                            display: 'flex'
                        }
                    }} onClick={() => {
                        setInvites(true);
                    }}><Persona {...{
                        text: 'Invites',
                        imageInitials: '♥',
                        initialsColor: PersonaInitialsColor.pink
                    }} /></DefaultButton>
                </>}
                <Stack.Item styles={{
                    root: {
                        paddingBottom: 50
                    }
                }}>
                    {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                        {t(error)}
                    </MessageBar> : <div></div>}
                </Stack.Item>
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