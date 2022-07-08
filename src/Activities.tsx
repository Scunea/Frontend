import React, { useState, useEffect } from 'react';
import { Stack, Text, DefaultButton, PrimaryButton, SearchBox, DatePicker, IconButton, Modal, DayOfWeek, MessageBar, MessageBarType } from '@fluentui/react';
import { SharedColors, NeutralColors } from '@fluentui/theme';
import FuzzySet from 'fuzzyset';
import InfiniteScroll from 'react-infinite-scroll-component';
import ReadActivity from './ReadActivity';
import NewActivity from './NewActivity';
import { Activity, FilesPlusPlus, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const Activities = (props: { domain: string | undefined; info: User; ws: WebSocket | undefined; }) => {

    const [activities, setActivities] = useState<Activity[]>([]);
    const [activitiesLoaded, setActivitiesLoaded] = useState<Activity[]>([]);
    const [searchFound, setSearchFound] = useState<Activity[] | boolean>(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [newActivity, setNewActivity] = useState(false);
    const [titlesFuzzySet, setTitlesFuzzySet] = useState(FuzzySet());
    const [namesFuzzySet, setNamesFuzzySet] = useState(FuzzySet());
    const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
    const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
    const [error, setError] = useState('');

    useEffect(() => {
        if (localStorage.getItem("token") && localStorage.getItem("school")) {
            fetch(props.domain + '/activities', {
                headers: new Headers({
                    'Authorization': localStorage.getItem('token') ?? "",
                    'School': localStorage.getItem('school') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (!json?.error) {
                        const activities = (json as Array<Activity>).sort((a, b) => b.date - a.date);
                        setActivities(activities);
                        activities.forEach(activity => {
                            setTitlesFuzzySet(titlesFuzzySet => {
                                titlesFuzzySet.add(activity.title);
                                return titlesFuzzySet;
                            });
                            if (props.info?.id === activity.author.id) {
                                setNamesFuzzySet(namesFuzzySet => {
                                    Object.values<FilesPlusPlus>(activity.delivered as any).forEach(thingy => {
                                        namesFuzzySet.add(thingy.name);
                                    });
                                    return namesFuzzySet;
                                });
                            }
                        });
                        setActivitiesLoaded(activities.slice(0, 20));
                    } else {
                        setError(json.error);
                    }
                });
        }

        if (props.ws) {
            props.ws.onmessage = (message: MessageEvent) => {
                if(message.data !== 'Ping!') {
                const data = JSON.parse(message.data);
                if (data.event === 'newActivity') {
                    setActivities(activities => {
                        let newActivities = [data, ...activities];
                        setActivitiesLoaded(newActivities.slice(0, 20));
                        return newActivities;
                    });
                    setTitlesFuzzySet(titlesFuzzySet => {
                        titlesFuzzySet.add(data.title);
                        return titlesFuzzySet;
                    });
                } else if (data.event === 'editedActivity') {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        newActivities[newActivities.findIndex(x => x.id === data.id)].title = data.newActivity.title;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].description = data.newActivity.description;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].title = data.newActivity.title;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].type = data.newActivity.type;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].delivery = data.newActivity.delivery;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].expiration = data.newActivity.expiration;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].receiver = data.newActivity.receiver;

                        setActivitiesLoaded(newActivities.slice(0, 20));
                        return newActivities;
                    });
                    setTitlesFuzzySet(titlesFuzzySet => {
                        titlesFuzzySet.add(data.newActivity.title);
                        return titlesFuzzySet;
                    });
                } else if (data.event === 'deletedActivity') {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        newActivities.splice(newActivities.findIndex(x => x.id === data.id), 1);
                        setActivitiesLoaded(newActivities.slice(0, 20));
                        return newActivities;
                    });
                } else if (data.event === 'viewedActivity') {

                } else if (data.event === 'deliveredActivity') {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        (newActivities[newActivities.findIndex(x => x.id === data.id)].viewed as any)[data.user] = true;
                        (newActivities[newActivities.findIndex(x => x.id === data.id)].delivered as any)[data.user] = data.delivery;
                        (newActivities[newActivities.findIndex(x => x.id === data.id)].result as any)[data.user] = 'Unchecked';

                        return newActivities;
                    });
                } else if (data.event === 'resultActivity') {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        newActivities[newActivities.findIndex(x => x.id === data.id)].result = data.result;

                        return newActivities;
                    });
                }
            }
            };
        }

    }, []);

    useEffect(() => {
        let activitiesLoadedPre: Activity[] = [];
        if (publishDate) {
            activities.forEach(activity => {
                const activityDate = new Date(activity.date);
                if (activityDate.getDate() === publishDate.getDate() && activityDate.getMonth() === publishDate.getMonth() && activityDate.getFullYear() === publishDate.getFullYear()) {
                    activitiesLoadedPre.push(activity);
                }
            });
        } else {
            activitiesLoadedPre = [...activities];
        }

        if (expirationDate) {
            console.log(activitiesLoadedPre.length);
            [...activitiesLoadedPre].forEach(activity => {
                const activityExpiration = new Date(activity.expiration);
                if (activityExpiration.getDate() !== expirationDate.getDate() || activityExpiration.getMonth() !== expirationDate.getMonth() || activityExpiration.getFullYear() !== expirationDate.getFullYear()) {
                    activitiesLoadedPre.splice(activitiesLoadedPre.findIndex(x => x.id === activity.id), 1);
                }
            });
        } else if (!publishDate) {
            setActivitiesLoaded(activities.slice(0, 20));
        }

        [...activitiesLoadedPre].forEach(activity => {
            if (Array.isArray(searchFound) && !searchFound.includes(activity)) {
                activitiesLoadedPre.splice(activitiesLoadedPre.findIndex(x => x.id === activity.id), 1);
            }
        })

        setActivitiesLoaded(activitiesLoadedPre);

    }, [publishDate, expirationDate, searchFound]);

    const { t } = useTranslation();

    return (
        <Stack styles={{
            root: {
                margin: 25,
            }
        }}>
            {selectedActivity ? <Modal isOpen styles={{
                main: {
                    width: 'calc(100% - 25px)',
                    height: 'calc(100% - 25px)'
                },
                scrollableContent: {
                    overflowY: 'none'
                }
            }}>
                <ReadActivity domain={props.domain} activities={activities} setActivities={setActivities} selectedActivity={selectedActivity} setSelectedActivity={setSelectedActivity} namesFuzzySet={namesFuzzySet} info={props.info}></ReadActivity>
            </Modal> : null}
            {newActivity ? <Modal isOpen styles={{
                main: {
                    width: 'calc(100% - 25px)',
                    height: 'calc(100% - 25px)'
                },
                scrollableContent: {
                    overflowY: 'none'
                }
            }}>
                <NewActivity domain={props.domain} info={props.info} newActivity={newActivity} setNewActivity={setNewActivity}></NewActivity>
            </Modal> : null}
            <Stack horizontal styles={{
                root: {
                    justifyContent: 'space-between'
                }
            }}>
                {props.info?.teacher ? <Stack.Item>
                    <PrimaryButton text={t('New activity')} iconProps={{ iconName: 'Send' }} onClick={() => setNewActivity(true)} />
                </Stack.Item> : null}
                <Stack.Item styles={{
                    root: {
                        width: '50%'
                    }
                }}>
                    <SearchBox placeholder={t('Search')} underlined onChange={event => {
                        if (event?.target.value) {
                            const found = titlesFuzzySet.get(event?.target.value ?? "", null, .1)?.map(x => x[1]);
                            let activitiesLoadedPre: Activity[] = [];
                            activities.forEach(activity => {
                                if (found?.includes(activity.title)) {
                                    activitiesLoadedPre.push(activity);
                                }
                            });
                            setSearchFound(activitiesLoadedPre);
                        } else {
                            setSearchFound(false);
                        }
                    }} />
                </Stack.Item>
                <Stack.Item styles={{
                    root: {
                        display: 'inline-flex'
                    }
                }}>
                    <DatePicker firstDayOfWeek={DayOfWeek.Sunday} placeholder={t('Select publish date...')} value={publishDate} onSelectDate={date => date !== null && setPublishDate(date)} />

                    <IconButton iconProps={{
                        iconName: 'ChromeClose'
                    }} onClick={() => setPublishDate(undefined)} />
                </Stack.Item>
                <Stack.Item styles={{
                    root: {
                        display: 'inline-flex'
                    }
                }}>
                    <DatePicker firstDayOfWeek={DayOfWeek.Sunday} placeholder={t('Select expiration date...')} value={expirationDate} onSelectDate={date => date !== null && setExpirationDate(date)} />

                    <IconButton iconProps={{
                        iconName: 'ChromeClose'
                    }} onClick={() => setExpirationDate(undefined)} />
                </Stack.Item>
            </Stack>
            <Stack styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                <Stack.Item>
                    {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} >
                        {t(error)}
                    </MessageBar> : null}
                </Stack.Item>
            </Stack>
            <Stack>
                {activitiesLoaded.length > 0 ? <InfiniteScroll
                    dataLength={activitiesLoaded.length}
                    next={() => {
                        setActivitiesLoaded(activities.slice(0, activitiesLoaded.length + 19));
                    }}
                    hasMore={activitiesLoaded.length !== activities.length}
                    loader={<Text styles={{
                        root: {
                            marginBottom: 25
                        }
                    }}>Loading...</Text>}>
                    {activitiesLoaded.map(activity => (
                        <Stack.Item key={activity.id} styles={{
                            root: {
                                cursor: 'pointer',
                                marginBottom: 25,
                                border: '1px solid black',
                                boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)'
                            }
                        }} onClick={() => {
                            if (!activity.viewed && !props.info?.administrator) {
                                fetch(props.domain + '/activities/view/' + activity.id, {
                                    method: 'POST',
                                    headers: new Headers({
                                        'Authorization': localStorage.getItem('token') ?? "",
                                        'School': localStorage.getItem('school') ?? ""
                                    })
                                })
                                    .then(res => res.json()).then(json => {
                                        if (!json?.error) {
                                            setActivities(activities => {
                                                activities[activities.findIndex(x => x.id === activity.id)].viewed = true;
                                                return activities;
                                            });
                                            setSelectedActivity(() => {
                                                activity.viewed = true;
                                                return activity;
                                            });
                                        } else {
                                            setError(json.error);
                                        }
                                    });
                            } else {
                                setSelectedActivity(activity);
                            }
                        }}>
                            <Stack styles={{
                                root: {
                                    height: 200,
                                    width: '100%',
                                    background: NeutralColors.white,
                                    justifyContent: 'center',
                                    padding: 25
                                }
                            }}>
                                <Stack.Item>
                                    <Text>{new Date(activity.date).toDateString()} - {activity.expiration ? (new Date(activity.expiration).toDateString()) : t('No expiration')}</Text>
                                </Stack.Item>
                                <Stack.Item>
                                    <Text variant="large">{activity.title}</Text>
                                </Stack.Item>
                                <Stack.Item>
                                    <Text>{t('Subject: something by somebody', { subject: activity.subject, teacher: activity.author.name })}</Text>
                                </Stack.Item>
                                {activity.type ? (<Stack.Item>
                                    <Text>{t('Type: something', { type: activity.type })}</Text>
                                </Stack.Item>) : null}
                                {activity.delivery ? (<Stack.Item>
                                    <Text>{t('Delivery: something', { delivery: activity.delivery })}</Text>
                                </Stack.Item>) : null}
                                {props.info?.id !== activity.author.id && !props.info?.administrator ? <Stack.Item>
                                    <DefaultButton styles={{
                                        root: {
                                            marginTop: 25,
                                            pointerEvents: 'none',
                                            backgroundColor: activity.viewed ? SharedColors.cyanBlue10 : activity.result === 'Accepted' ? SharedColors.greenCyan10 : activity.result === 'Rejected' ? SharedColors.red10 : SharedColors.gray20,
                                            color: 'white'
                                        }
                                    }}>{!activity.result ? activity.viewed ? t('Viewed') : t('Not viewed') : t(activity.result)}</DefaultButton>
                                </Stack.Item> : null}
                            </Stack>
                        </Stack.Item>
                    ))}
                </InfiniteScroll> : <Text styles={{
                    root: {
                        marginBottom: 25
                    }
                }}>{t('No activities!')}</Text>}
            </Stack>
        </Stack>
    );
};

export default Activities;