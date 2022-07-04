import React, { useEffect, useRef, useState } from 'react';
import { Stack, Text, MessageBar, MessageBarButton, MessageBarType, Persona, PersonaSize, ContextualMenu, ContextualMenuItemType, getTheme, DefaultButton, Modal, PrimaryButton, TextField } from '@fluentui/react';
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
import { User } from './interfaces';
import './fixes.css';
import { useTranslation } from 'react-i18next';

const domain = process.env.REACT_APP_DOMAIN;

export const App: React.FunctionComponent = () => {

  const personaRef = useRef(null);

  const [ws, setWs] = useState<WebSocket>();
  const [websocketLost, setWebsocketLost] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [selected, setSelected] = useState('');
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [editUser, { toggle: toggleEditUser }] = useBoolean(false);
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    setSelected(document.location.hash.split('?')[0].slice(1));

    if (localStorage.getItem("token") && localStorage.getItem("schoolId")) {
      fetch(domain + '/info', {
        headers: new Headers({
          'Authorization': localStorage.getItem('token') ?? "",
          'School': localStorage.getItem('schoolId') ?? ""
        })
      })
        .then(res => {
          if (res.status === 200) {
            setWs(connectWebsocket(localStorage.getItem('token') ?? '', localStorage.getItem('schoolId') ?? ''));
            return res.json();
          } else {
            return {};
          }
        }).then(json => setUserInfo(json as User));
    }

  }, []);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (message: MessageEvent) => {
        const data = JSON.parse(message.data);
        if (data.event === 'newUser') {
          setUserInfo(userInfo => {
            if (userInfo) {
              let newUserInfo = { ...userInfo };
              newUserInfo.avaliable.push({
                id: data.user.id,
                name: data.user.name,
                teacher: data.user.subject,
                child: data.user.child,
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
              const index = newUserInfo.avaliable.findIndex(x => x.id === data.user.id);
              newUserInfo.avaliable[index].name = data.user.name;
              newUserInfo.avaliable[index].teacher = data.user.subject;
              return newUserInfo;
            } else {
              return userInfo;
            }
          })
        } else if (data.event === 'deletedUser') {
          setUserInfo(userInfo => {
            if (userInfo) {
              let newUserInfo = { ...userInfo };
              const index = newUserInfo.avaliable.findIndex(x => x.id === data.userId);
              if (index > -1) {
                newUserInfo.avaliable.splice(index, 1);
              }
              return newUserInfo;
            } else {
              return userInfo;
            }
          })
        }
      }
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

  function connectWebsocket(token: string, school: string) {
    const ws = new WebSocket('ws://' + domain?.split('://')[1] + '/socket?token=' + encodeURIComponent(token) + '&school=' + encodeURIComponent(school));

    ws.onopen = () => {
      console.info('[WebSocket] Connected');
    };

    ws.onclose = () => {
      console.warn('[WebSocket] Disconnected');
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
                  {userInfo?.administrator ? <Stack.Item>
                    <TextField placeholder={t('Name')} value={name} underlined onChange={(event, value) => setName(value ?? '')}></TextField>
                  </Stack.Item> : null}
                  <Stack.Item>
                    <TextField type="password" placeholder={t('New password')} value={password} underlined onChange={(event, value) => setPassword(value ?? '')}></TextField>
                  </Stack.Item>
                  <Stack.Item>
                    <TextField type="password" placeholder={t('Current password')} value={currentPassword} underlined onChange={(event, value) => setCurrentPassword(value ?? '')}></TextField>
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
                    fetch(domain + '/people', {
                      method: 'PATCH',
                      body: JSON.stringify({
                        name: name,
                        password: password,
                        currentPassword: currentPassword
                      }),
                      headers: new Headers({
                        'Authorization': localStorage.getItem('token') ?? "",
                        'School': localStorage.getItem('schoolId') ?? "",
                        'Content-Type': 'application/json'
                      })
                    }).then(res => {
                      if (res.status === 200) {

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
            if (item?.key === 'editProfile') {

            } else if (item?.key === 'signOut') {
              localStorage.removeItem('schoolId');
              localStorage.removeItem('token');
              window.location.reload();
            } else if (item?.key === 'switchSchool') {
              localStorage.removeItem('schoolId');
              window.location.reload();
            }
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
              key: 'switchSchool',
              iconProps: { iconName: 'Switch' },
              text: t('Switch school')
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
              text: t('Sign out')
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
                            <Home></Home>) : null
          }
        </Stack>
      }
      {websocketLost ? <MessageBar messageBarType={MessageBarType.warning} isMultiline={false} onDismiss={() => setWebsocketLost(false)} actions={
        <div>
          <MessageBarButton onClick={() => window.location.reload()}>Refresh</MessageBarButton>
        </div>
      } styles={{
        root: {
          position: 'absolute',
          bottom: 0
        }
      }} >
        {t('We lost connection to the WebSocket. This will prevent automatically loading new posts. Would you like to refresh the page to try to reconnect?')}
      </MessageBar> : null}
    </>) : (<Stack horizontalAlign='center' verticalAlign='center' verticalFill>
      <Login domain={domain}></Login>
    </Stack>)
  );
};

