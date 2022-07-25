import React, { useEffect, useRef, useState } from 'react';
import { Stack, Text, MessageBar, MessageBarButton, MessageBarType, Persona, PersonaSize, ContextualMenu, ContextualMenuItemType, getTheme, DefaultButton, Modal, PrimaryButton, TextField, Link, Image, IconButton } from '@fluentui/react';
import { useBoolean } from '@fluentui/react-hooks';
import { NeutralColors, SharedColors } from '@fluentui/theme';
import i18n from './i18n';
import Login from './Login';
import Nav from './Nav';
import Home from './Home';
import Schedule from './Schedule';
import Grades from './Grades';
import Messages from './Messages';
import Reports from './Reports';
import Teachers from './Teachers';
import Activities from './Activities';
import Administration from './Administration';
import { IdPlusName, OTP, User } from './interfaces';
import './fixes.css';
import { useTranslation } from 'react-i18next';

const domain = import.meta.env.VITE_DOMAIN;

export const App: React.FunctionComponent = () => {

  const personaRef = useRef(null);

  const [ws, setWs] = useState<WebSocket>();
  const [websocketLost, setWebsocketLost] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [selected, setSelected] = useState('');
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [editUser, { toggle: toggleEditUser }] = useBoolean(false);
  const [setupTfa, { toggle: toggleSetupTfa }] = useBoolean(false);
  const [deleteAccount, { toggle: toggleDeleteAccount }] = useBoolean(false);
  const [parents, { toggle: toggleParents }] = useBoolean(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpInfo, setOtpInfo] = useState<OTP>();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [childrenInvites, setChildrenInvites] = useState<IdPlusName[]>([]);
  const [parentsInvites, setParentsInvites] = useState<IdPlusName[]>([]);
  const [error, setError] = useState('');

  function askPermission() {
    return new Promise(function (resolve, reject) {
      const permissionResult = Notification.requestPermission(function (result) {
        resolve(result);
      });

      if (permissionResult) {
        permissionResult.then(resolve, reject);
      }
    }).then(function (permissionResult) {
      if (permissionResult === 'granted') {
        console.log('[Push Notifications] Permission granted.');
        subscribeUserToPush();
      } else {
        console.warn('[Push Notifications] Permission denied.');
      }
    });
  }

  function subscribeUserToPush() {
    return navigator.serviceWorker
      .register('/service-worker.js')
      .then(function (registration) {
        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
          ),
        };

        return registration.pushManager.subscribe(subscribeOptions);
      })
      .then(function (pushSubscription) {
        fetch(domain + '/notifications', {
          method: 'POST',
          body: JSON.stringify(pushSubscription),
          headers: new Headers({
            'Authorization': localStorage.getItem('token') ?? "",
            'School': localStorage.getItem('school') ?? "",
            'Content-Type': 'application/json'
          })
        }).then(res => res.json()).then(json => {
          if (!json?.error) {
            console.log('[Push Notifications] Subscribed successfully.');
          }
        });
        return pushSubscription;
      });
  }

  function urlBase64ToUint8Array(base64String: string) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  useEffect(() => {
    setSelected(document.location.hash.split('?')[0].slice(1));

    if (localStorage.getItem("token") && localStorage.getItem("school")) {
      fetch(domain + '/info', {
        headers: new Headers({
          'Authorization': localStorage.getItem('token') ?? "",
          'School': localStorage.getItem('school') ?? ""
        })
      })
        .then(res => res.json()).then(json => {
          if (!json?.error) {
            setWs(connectWebsocket(localStorage.getItem('token') ?? '', localStorage.getItem('school') ?? ''));
            setUserInfo(json);
          } else {
            setError(json.error);
          }
        });

      fetch(domain + '/pendingchildren', {
        headers: new Headers({
          'Authorization': localStorage.getItem('token') ?? "",
          'School': localStorage.getItem('school') ?? ""
        })
      })
        .then(res => res.json()).then(json => {
          if (!json?.error) {
            setChildrenInvites(json);
          } else {
            setError(json.error);
          }
        });

      fetch(domain + '/pendingparents', {
        headers: new Headers({
          'Authorization': localStorage.getItem('token') ?? "",
          'School': localStorage.getItem('school') ?? ""
        })
      })
        .then(res => res.json()).then(json => {
          if (!json?.error) {
            setParentsInvites(json);
          } else {
            setError(json.error);
          }
        });
    }

  }, []);

  useEffect(() => {
    if (ws) {
      ws.addEventListener('message', (message: MessageEvent) => {
          const data = JSON.parse(message.data);
          if (data.event === 'editedSchool') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                newUserInfo.schoolName = data.name;
                newUserInfo.schoolLogo = data.logo;
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'newGrades') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                newUserInfo.grades = data.grades;
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'newUser') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                newUserInfo.available.push({
                  id: data.user.id,
                  name: data.user.name,
                  teacher: data.user.subject,
                  children: data.user.children,
                  type: data.user.type.split('').map((x: string, i: number) => i === 0 ? x.toUpperCase() : x).join('')
                });
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'editedUser') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                const index = newUserInfo.available.findIndex(x => x.id === data.user.id);
                newUserInfo.available[index].name = data.user.name;
                newUserInfo.available[index].teacher = data.user.subject;
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'deletedUser') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                const index = newUserInfo.available.findIndex(x => x.id === data.userId);
                if (index > -1) {
                  newUserInfo.available.splice(index, 1);
                }
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'parentInvited') {
            setParentsInvites(parents => {
              let newParents = [...parents];
              newParents.push(data.parent);
              return newParents;
            });
          } else if (data.event === 'childrenInvited') {
            setChildrenInvites(children => {
              let newChildren = [...children];
              newChildren.push(data.children);
              return newChildren;
            });
          } else if (data.event === 'parentInviteRemoved') {
            setParentsInvites(parents => {
              let newParents = [...parents];
              const index = newParents.findIndex(x => x?.id === data.id);
              if (index > -1) {
                newParents.splice(data.id, 1);
              }
              return newParents;
            });
          } else if (data.event === 'childrenInviteRemoved') {
            setChildrenInvites(children => {
              let newChildren = [...children];
              const index = newChildren.findIndex(x => x?.id === data.id);
              if (index > -1) {
                newChildren.splice(data.id, 1);
              }
              return newChildren;
            });
          }
      });
    }
  }, [ws]);

  useEffect(() => {
    const systemLangTwo = navigator.language.slice(0, 2);
    setLanguage(localStorage.getItem('language') ?? (systemLangTwo === 'en' || systemLangTwo === 'es' ? systemLangTwo : 'en'));
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    if (setupTfa) {
      fetch(domain + '/otp', {
        method: 'POST',
        headers: new Headers({
          'Authorization': localStorage.getItem('token') ?? "",
          'School': localStorage.getItem('school') ?? "",
        })
      }).then(res => res.json()).then(json => {
        if (!json?.error) {
          setOtpInfo(json);
        }
      });
    }
  }, [setupTfa]);

  function connectWebsocket(token: string, school: string) {
    const ws = new WebSocket('ws://' + domain?.split('://')[1] + '/socket?token=' + encodeURIComponent(token) + '&school=' + encodeURIComponent(school));

    ws.onopen = () => {
      console.info('[WebSocket] Connected.');
    };

    ws.onclose = () => {
      console.warn('[WebSocket] Disconnected.');
      setWebsocketLost(true);
    }

    setLoggedIn(true);
    return ws;
  }

  const { t } = useTranslation();

  return (
    loggedIn ? (<>
      <Stack horizontal verticalAlign='center' styles={{
        root: {
          position: 'relative',
          width: '100%',
          height: 48,
          backgroundColor: SharedColors.cyanBlue10
        }
      }}>
        <Stack.Item grow>
          <Text variant="large" styles={{
            root: {
              marginLeft: 10,
              color: NeutralColors.white,
              fontWeight: 600
            }
          }}>{t(selected ? selected.split('').map((x, i) => i === 0 ? x.toUpperCase() : x).join('') : 'Home')}</Text>
        </Stack.Item>
        <Stack.Item styles={{
          root: {
            marginRight: 10
          }
        }}>
          <Modal isOpen={editUser} onDismiss={toggleEditUser}>
            <Stack>
              <div style={{
                borderTop: `4px solid ${getTheme().palette.themePrimary}`
              }}></div>
              <Text variant={'xLarge'} styles={{
                root: {
                  color: getTheme().palette.themePrimary,
                  padding: '16px 46px 20px 24px'
                }
              }}>{t('Edit profile')}</Text>
              <Stack.Item styles={{
                root: {
                  padding: '0px 24px 24px'
                }
              }}>
                <Stack tokens={{
                  childrenGap: 25
                }}>
                  <Stack.Item>
                    <TextField placeholder={t('Name')} value={name} underlined onChange={(event, value) => setName(value ?? '')}></TextField>
                  </Stack.Item>
                  <Stack.Item>
                    <TextField type="password" placeholder={t('New password')} value={password} underlined onChange={(event, value) => setPassword(value ?? '')}></TextField>
                  </Stack.Item>
                  <Stack.Item>
                    <TextField type="password" placeholder={t('Current password')} value={currentPassword} underlined onChange={(event, value) => setCurrentPassword(value ?? '')}></TextField>
                  </Stack.Item>
                  {!userInfo?.tfa ? <Stack.Item>
                    <Link onClick={() => {
                      toggleEditUser();
                      toggleSetupTfa();
                    }}>Set up 2FA</Link>
                  </Stack.Item> : <Stack.Item>
                    <Link onClick={() => {
                      toggleEditUser();
                      toggleSetupTfa();
                    }}>Remove 2FA</Link>
                  </Stack.Item>}
                  <Stack.Item>
                    <Link onClick={() => {
                      toggleEditUser();
                      toggleDeleteAccount();
                    }}>Delete account</Link>
                  </Stack.Item>
                </Stack>
                <div style={{
                  margin: '16px 0px 0px',
                  textAlign: 'right',
                  marginRight: '-4px'
                }}>
                  <PrimaryButton disabled={!name && !password} styles={{
                    root: {
                      margin: '0 4px'
                    }
                  }} onClick={() => {
                    fetch(domain + '/account', {
                      method: 'PATCH',
                      body: JSON.stringify({
                        name: name,
                        password: password,
                        currentPassword: currentPassword
                      }),
                      headers: new Headers({
                        'Authorization': localStorage.getItem('token') ?? "",
                        'School': localStorage.getItem('school') ?? "",
                        'Content-Type': 'application/json'
                      })
                    }).then(res => res.json()).then(json => {
                      if (!json?.error) {

                        toggleEditUser();
                        setCurrentPassword('');
                        setName('');
                        setPassword('');
                      }
                    });
                  }} text={t('Save')} />
                  <DefaultButton onClick={toggleEditUser} text={t('Cancel')} styles={{
                    root: {
                      margin: '0 4px'
                    }
                  }} />
                </div>
              </Stack.Item>
            </Stack>
          </Modal>
          <Modal isOpen={setupTfa} onDismiss={toggleSetupTfa}>
            <Stack>
              <div style={{
                borderTop: `4px solid ${getTheme().palette.themePrimary}`
              }}></div>
              <Text variant={'xLarge'} styles={{
                root: {
                  color: getTheme().palette.themePrimary,
                  padding: '16px 46px 20px 24px'
                }
              }}>{t('Set up 2FA')}</Text>
              <Stack.Item styles={{
                root: {
                  padding: '0px 24px 24px'
                }
              }}>
                <Stack tokens={{
                  childrenGap: 25
                }}>
                  <Stack.Item align="center">
                    <Image src={otpInfo?.qr} alt={otpInfo?.secret} />
                  </Stack.Item>
                  <Stack.Item>
                    <Text>{otpInfo?.secret}</Text>
                  </Stack.Item>
                  <Stack.Item>
                    <TextField type="password" placeholder={t('Current password')} value={currentPassword} underlined onChange={(event, value) => setCurrentPassword(value ?? '')}></TextField>
                  </Stack.Item>
                  <Stack.Item>
                    <TextField placeholder={t('OTP')} value={otp} underlined onChange={(event, value) => setOtp(value ?? '')}></TextField>
                  </Stack.Item>
                </Stack>
                <div style={{
                  margin: '16px 0px 0px',
                  textAlign: 'right',
                  marginRight: '-4px'
                }}>
                  <PrimaryButton disabled={!password || !otp} styles={{
                    root: {
                      margin: '0 4px'
                    }
                  }} onClick={() => {
                    fetch(domain + '/otp/' + otpInfo?.secret, {
                      method: 'POST',
                      body: JSON.stringify({
                        password: currentPassword,
                        otp: otp.split(" ").join("")
                      }),
                      headers: new Headers({
                        'Authorization': localStorage.getItem('token') ?? "",
                        'School': localStorage.getItem('school') ?? "",
                        'Content-Type': 'application/json'
                      })
                    }).then(res => res.json()).then(json => {
                      if (!json?.error) {
                        toggleSetupTfa();
                        toggleEditUser();
                        setCurrentPassword('');
                        setOtp('');
                      }
                    });
                  }} text={t('Save')} />
                  <DefaultButton onClick={() => {
                    toggleSetupTfa();
                    toggleEditUser();
                  }} text={t('Cancel')} styles={{
                    root: {
                      margin: '0 4px'
                    }
                  }} />
                </div>
              </Stack.Item>
            </Stack>
          </Modal>
          <Modal isOpen={deleteAccount} onDismiss={toggleDeleteAccount}>
            <Stack>
              <div style={{
                borderTop: `4px solid ${getTheme().palette.themePrimary}`
              }}></div>
              <Text variant={'xLarge'} styles={{
                root: {
                  color: getTheme().palette.themePrimary,
                  padding: '16px 46px 20px 24px'
                }
              }}>{t('Delete your account?')}</Text>
              <Stack.Item styles={{
                root: {
                  padding: '0px 24px 24px'
                }
              }}>
                <Stack tokens={{
                  childrenGap: 25
                }}>
                  <Stack.Item>
                    <Text>{t('Public data will be kept.')}</Text>
                  </Stack.Item>
                  <Stack.Item>
                    <TextField type="password" placeholder={t('Current password')} value={currentPassword} underlined onChange={(event, value) => setCurrentPassword(value ?? '')}></TextField>
                  </Stack.Item>
                  {userInfo?.tfa ? <Stack.Item>
                    <TextField placeholder={t('OTP')} value={otp} underlined onChange={(event, value) => setOtp(value ?? '')}></TextField>
                  </Stack.Item> : null}
                </Stack>
                <div style={{
                  margin: '16px 0px 0px',
                  textAlign: 'right',
                  marginRight: '-4px'
                }}>
                  <PrimaryButton disabled={!currentPassword || !(otp || !userInfo?.tfa)} styles={{
                    root: {
                      margin: '0 4px'
                    }
                  }} onClick={() => {
                    fetch(domain + '/account', {
                      method: 'DELETE',
                      body: JSON.stringify({
                        password: currentPassword,
                        otp: otp.split(" ").join("")
                      }),
                      headers: new Headers({
                        'Authorization': localStorage.getItem('token') ?? "",
                        'School': localStorage.getItem('school') ?? "",
                        'Content-Type': 'application/json'
                      })
                    }).then(res => res.json()).then(json => {
                      if (!json?.error) {
                        localStorage.removeItem('school');
                        localStorage.removeItem('token');
                        window.location.reload();
                      }
                    });
                  }} text={t('Delete')} />
                  <DefaultButton onClick={() => {
                    toggleSetupTfa();
                    toggleEditUser();
                  }} text={t('Cancel')} styles={{
                    root: {
                      margin: '0 4px'
                    }
                  }} />
                </div>
              </Stack.Item>
            </Stack>
          </Modal>
          <Modal isOpen={parents} onDismiss={toggleParents}>
            <Stack>
              <div style={{
                borderTop: `4px solid ${getTheme().palette.themePrimary}`
              }}></div>
              <Text variant={'xLarge'} styles={{
                root: {
                  color: getTheme().palette.themePrimary,
                  padding: '16px 46px 20px 24px'
                }
              }}>{t('Invite your parents')}</Text>
              <Stack.Item styles={{
                root: {
                  padding: '0px 24px 24px'
                }
              }}>
                <Stack tokens={{
                  childrenGap: 25
                }}>
                  <Stack.Item>
                    <TextField placeholder="Email" value={email} underlined onChange={(event, value) => setEmail(value ?? '')}></TextField>
                  </Stack.Item>
                </Stack>
                <div style={{
                  margin: '16px 0px 0px',
                  textAlign: 'right',
                  marginRight: '-4px'
                }}>
                  <PrimaryButton disabled={!email} styles={{
                    root: {
                      margin: '0 4px'
                    }
                  }} onClick={() => {
                    fetch(domain + '/parents', {
                      method: 'PUT',
                      body: JSON.stringify({
                        email: email
                      }),
                      headers: new Headers({
                        'Authorization': localStorage.getItem('token') ?? "",
                        'School': localStorage.getItem('school') ?? "",
                        'Content-Type': 'application/json'
                      })
                    }).then(res => res.json()).then(json => {
                      if (!json?.error) {
                        toggleParents();
                        setEmail('');
                      } else {
                        setError(json.error);
                      }
                    });
                  }} text={t('Invite')} />
                </div>
              </Stack.Item>
              <Text variant={'xLarge'} styles={{
                root: {
                  color: getTheme().palette.themePrimary,
                  padding: '16px 46px 20px 24px'
                }
              }}>{t('Accept an invite')}</Text>
              <Stack.Item styles={{
                root: {
                  padding: '0px 24px 24px'
                }
              }}>
                <Stack tokens={{
                  childrenGap: 10
                }}>
                  {childrenInvites.length > 0 ? childrenInvites.map(student => <DefaultButton key={student.id} styles={{
                    root: {
                      minHeight: 75,
                      display: 'flex'
                    }
                  }} onClick={() => {
                    fetch(domain + '/accept/' + student.id, {
                      method: 'POST',
                      headers: new Headers({
                        'Authorization': localStorage.getItem('token') ?? "",
                        'School': localStorage.getItem('school') ?? ""
                      })
                    }).then(res => res.json()).then(json => {
                      if (!json?.error) {
                        toggleParents();
                        setEmail('');
                      } else {
                        setError(json.error);
                      }
                    });
                  }}><Persona {...{
                    text: student.name
                  }} /></DefaultButton>) : <Text>{t('No invites available.')}</Text>}
                </Stack>
              </Stack.Item>
              <Text variant={'xLarge'} styles={{
                root: {
                  color: getTheme().palette.themePrimary,
                  padding: '16px 46px 20px 24px'
                }
              }}>{t('Your pending invites')}</Text>
              <Stack.Item styles={{
                root: {
                  padding: '0px 24px 24px'
                }
              }}>
                <Stack tokens={{
                  childrenGap: 10
                }}>
                  {parentsInvites.length > 0 ? parentsInvites.map(parent => <Stack horizontal verticalAlign="center" key={parent.id}>
                    <Stack.Item grow>
                      <Persona {...{
                        text: parent.name,
                        styles: {
                          root: {
                            minHeight: 75,
                            display: 'flex'
                          }
                        }
                      }} />
                    </Stack.Item>
                    <Stack.Item>
                      <IconButton iconProps={{ iconName: 'ChromeClose' }} onClick={() => {
                        fetch(domain + '/parents/' + parent.id, {
                          method: 'DELETE',
                          headers: new Headers({
                            'Authorization': localStorage.getItem('token') ?? "",
                            'School': localStorage.getItem('school') ?? ""
                          })
                        }).then(res => res.json()).then(json => {
                          if (!json?.error) {
                            toggleParents();
                            setEmail('');
                          } else {
                            setError(json.error);
                          }
                        });
                      }}></IconButton>
                    </Stack.Item>
                  </Stack>) : <Text>{t('You didn\'t invite anyone.')}</Text>}
                </Stack>
                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} styles={{
                  root: {
                    marginTop: 24
                  }
                }}>
                  {t(error)}
                </MessageBar> : null}
                <div style={{
                  margin: '16px 0px 0px',
                  textAlign: 'right',
                  marginRight: '-4px'
                }}>
                  <DefaultButton onClick={toggleParents} text={t('Cancel')} styles={{
                    root: {
                      margin: '0 4px'
                    }
                  }} />
                </div>
              </Stack.Item>
            </Stack>
          </Modal>
          <Persona ref={personaRef} {...{
            text: userInfo?.name,
            hidePersonaDetails: true,
            size: PersonaSize.size32
          }} styles={{
            root: {
              cursor: 'pointer'
            }
          }} onClick={() => {
            setShowPersonaMenu(true);
          }} />
          <ContextualMenu hidden={!showPersonaMenu} onDismiss={() => setShowPersonaMenu(false)} target={personaRef} onItemClick={(event, item) => {
            setShowPersonaMenu(false);
          }} items={[
            {
              key: 'username',
              itemType: ContextualMenuItemType.Header,
              text: userInfo?.name
            },
            {
              key: 'divider',
              itemType: ContextualMenuItemType.Divider
            },
            {
              key: 'editProfile',
              iconProps: { iconName: 'Edit' },
              text: t('Edit profile'),
              onClick: () => {
                setName(userInfo?.name ?? '');
                toggleEditUser();
              }
            },
            {
              key: 'enableNotifications',
              iconProps: { iconName: 'Ringer' },
              text: t('Enable notifications'),
              onClick: () => {
                askPermission();
              }
            },
            {
              key: 'parents',
              iconProps: { iconName: 'People' },
              text: t('Parents'),
              onClick: () => {
                toggleParents();
              }
            },
            {
              key: 'switchSchool',
              iconProps: { iconName: 'Switch' },
              text: t('Switch school'),
              onClick: () => {
                localStorage.removeItem('school');
                window.location.reload();
              }
            },
            {
              key: 'changeLanguage',
              iconProps: { iconName: 'Translate' },
              text: t('Change language'),
              subMenuProps: {
                items: [
                  {
                    key: 'en',
                    text: 'English/Inglés',
                    disabled: language === 'en',
                    onClick: () => {
                      setLanguage('en');
                    }
                  },
                  {
                    key: 'es',
                    text: 'Spanish/Español',
                    disabled: language === 'es',
                    onClick: () => {
                      setLanguage('es');
                    }
                  }
                ]
              }
            },
            {
              key: 'signOut',
              iconProps: { iconName: 'SignOut' },
              text: t('Sign out'),
              onClick: () => {
                localStorage.removeItem('school');
                localStorage.removeItem('token');
                window.location.reload();
              }
            }
          ]} />
        </Stack.Item>
      </Stack>
      {userInfo ? <Nav info={userInfo} selected={selected} setSelected={setSelected}></Nav> : null}
      {
        <Stack styles={{
          root: {
            position: 'absolute',
            width: 'calc(100% - 200px)',
            height: 0,
            right: 0,
            top: 43
          }
        }}>
          {
            userInfo ? (
              selected === "schedule" ?
                <Schedule language={language} domain={domain} info={userInfo} ws={ws}></Schedule> :
                selected === "grades" ?
                  <Grades domain={domain} info={userInfo} ws={ws}></Grades> :
                  selected === "messages" ?
                    <Messages domain={domain} info={userInfo} ws={ws}></Messages> :
                    selected === "reports" ?
                      <Reports domain={domain} info={userInfo} ws={ws}></Reports> :
                      selected === "teachers" ?
                        <Teachers info={userInfo}></Teachers> :
                        selected === "activities" ?
                          <Activities domain={domain} info={userInfo} ws={ws}></Activities> :
                          selected === 'administration' ?
                            <Administration domain={domain} info={userInfo} ws={ws}></Administration> :
                            <Home domain={domain} info={userInfo}></Home>) : null
          }
        </Stack>
      }
      {websocketLost ? <MessageBar messageBarType={MessageBarType.warning} isMultiline={false} onDismiss={() => setWebsocketLost(false)} actions={
        <div>
          <MessageBarButton onClick={() => window.location.reload()}>{t('Refresh')}</MessageBarButton>
        </div>
      } styles={{
        root: {
          position: 'absolute',
          bottom: 0
        }
      }} >
        {t('We lost connection to the WebSocket. This will prevent automatically loading new posts. Would you like to refresh the page to try to reconnect?')}
      </MessageBar> : null}
    </>) : (<Stack horizontalAlign='center' verticalAlign='center' verticalFill horizontal wrap>
      <Login domain={domain}></Login>
    </Stack>)
  );
};
