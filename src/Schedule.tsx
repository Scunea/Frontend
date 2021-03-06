import React, { useEffect, useState } from 'react';
import { Stack, Modal, Text, PrimaryButton, IconButton, MessageBar, MessageBarType } from '@fluentui/react';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import FuzzySet from 'fuzzyset';
import moment from 'moment';
import 'moment/locale/es';
import ReadActivity from './ReadActivity';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Activity, FilesPlusPlus, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const Schedule = (props: { language: string; domain: string | undefined; info: User; ws: WebSocket | undefined; }) => {

    moment.locale(props.language);
    const localizer = momentLocalizer(moment);

    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [namesFuzzySet, setNamesFuzzySet] = useState(FuzzySet());
    const [events, setEvents] = useState<any[]>([]);
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
                            if (props.info?.id === activity.author.id) {
                                setNamesFuzzySet(namesFuzzySet => {
                                    Object.values<FilesPlusPlus>(activity.delivered as any).forEach(thingy => {
                                        namesFuzzySet.add(thingy.name);
                                    });
                                    return namesFuzzySet;
                                });
                            }
                        });
                        setEvents(activities.map((activity, i) => {
                            if (activity.expiration) {
                                let returned = {
                                    id: i,
                                    activityId: activity.id,
                                    title: activity.title,
                                    start: activity.expiration,
                                    end: activity.expiration
                                };
                                return returned;
                            } else {
                                return {
                                    id: false
                                };
                            }
                        }).filter(x => typeof x.id !== 'boolean'));
                    } else {
                        setError(json.error);
                    }
                });
        }
    }, []);

    const { t } = useTranslation();

    return (
        <Stack styles={{
            root: {
                padding: 25
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
            <Calendar localizer={localizer} style={{ height: 'calc(100vh - 100px)' }} views={['month']} events={events} onSelectEvent={event => {
                setSelectedActivity(activities.find(x => x.id === event.activityId) ?? null);
            }} components={{
                toolbar: (props) => {
                    return <Stack horizontal verticalAlign='center' styles={{
                        root: {
                            marginBottom: 10
                        }
                    }}>
                        <Stack.Item styles={{
                            root: {
                                marginRight: 5
                            }
                        }}>
                            <PrimaryButton text={t('Today')} onClick={() => props.onNavigate('TODAY')} />
                        </Stack.Item>
                        <Stack.Item>
                            <IconButton iconProps={{ iconName: 'Back' }} onClick={() => props.onNavigate('PREV')} />
                        </Stack.Item>
                        <Stack.Item>
                            <IconButton iconProps={{ iconName: 'Forward' }} onClick={() => props.onNavigate('NEXT')} />
                        </Stack.Item>
                        <Stack.Item grow styles={{
                            root: {
                                marginRight: 10
                            }
                        }}>
                            {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                                {t(error)}
                            </MessageBar> : <div></div>}
                        </Stack.Item>
                        <Stack.Item>
                            <Text variant="large">{props.label}</Text>
                        </Stack.Item>
                    </Stack>
                }
            }} />
        </Stack>
    );
};

export default Schedule;