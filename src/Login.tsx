import React, { useEffect, useState } from 'react';
import { Stack, Image, Text, TextField, PrimaryButton, Persona, DefaultButton, IconButton, Link, PersonaInitialsColor, MessageBar, MessageBarType } from '@fluentui/react';
import logo from './Logo.svg';
import { School } from './interfaces';
import { useTranslation } from 'react-i18next';
import { setegid } from 'process';

const Login = (props: { domain: string | undefined; }) => {

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOtp, setShowOtp] = useState(false);
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
                        setPending(json.pendingschools);
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
                {token || showOtp ? <IconButton iconProps={{ iconName: 'Back' }} onClick={() => {
                    setError('');
                    if (showOtp) {
                        setShowOtp(false);
                    } else if (createSchool) {
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
            {!token ? !signedUp ? <>
                <Stack.Item>
                    <TextField placeholder="Email" type="email" disabled={showOtp} styles={{
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
                    <TextField placeholder={t('Password')} disabled={showOtp} styles={{
                        root: {
                            marginLeft: 50,
                            marginRight: 50
                        }
                    }} type="password" underlined onChange={(event, value) => {
                        setPassword(value ?? '');
                    }}></TextField>
                </Stack.Item>
                {showOtp ? <Stack.Item>
                    <TextField placeholder={t('OTP')} styles={{
                        root: {
                            marginLeft: 50,
                            marginRight: 50
                        }
                    }} underlined onChange={(event, value) => {
                        setOtp(value ?? '');
                    }}></TextField>
                </Stack.Item> : null}
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
                        setShowOtp(false);
                        setError('');
                        setSignUp(!signUp);
                    }}>{!signUp ? t('Sign up') : t('Sign in')}</Link>
                </Stack.Item>
                <Stack.Item>
                    {!signUp ? <PrimaryButton disabled={!(email && password && (!showOtp || otp))} text={t('Next')} styles={{
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
                        setError('');
                        fetch(props.domain + '/login', {
                            method: 'POST',
                            body: JSON.stringify({
                                email: email,
                                password: password,
                                otp: otp
                            }),
                            headers: new Headers({
                                'Content-Type': 'application/json'
                            })
                        })
                            .then(res => res.json()).then(json => {
                                if (!json?.error) {
                                    if (!json?.missingOtp) {
                                        localStorage.setItem('token', json.token);
                                        setName('');
                                        setEmail('');
                                        setPassword('');
                                        setOtp('');
                                        setToken(json.token);
                                        setSchools(json.schools);
                                        setPending(json.pendingschools);
                                    } else {
                                        setShowOtp(true);
                                    }
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
            </> : <Text styles={{
                root: {
                    marginLeft: 50,
                    marginRight: 50
                }
            }}>{t('Your account has been created. Please verify your email to start using our service.')}</Text> : createSchool ? <>

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
                        setError('');
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
                                localStorage.setItem('school', json.id);
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
                        localStorage.setItem('school', school.id);
                        window.location.reload();
                    } else {
                        setError(json.error);
                    }
                });
            }}><Persona {...{
                text: school.name,
                imageUrl: school?.logo ? props.domain + '/static/' + school?.logo : undefined
            }} /></DefaultButton>) : <Text styles={{
                root: {
                    marginLeft: 50,
                    marginRight: 50
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
                    localStorage.setItem('school', school.id);
                    window.location.reload();
                }}><Persona {...{
                    text: school.name,
                    imageUrl: school?.logo ? props.domain + '/static/' + school?.logo : undefined
                }} /></DefaultButton>)}
                <DefaultButton styles={{
                    root: {
                        marginLeft: 50,
                        marginRight: 50,
                        minHeight: 75,
                        display: 'flex'
                    }
                }} onClick={() => {
                    setError('');
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
                    setError('');
                    setInvites(true);
                }}><Persona {...{
                    text: t('Invites'),
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
    );
};

export default Login;