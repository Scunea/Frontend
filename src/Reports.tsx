import React, { useState, useEffect } from 'react';
import { Stack, PrimaryButton, SearchBox, DatePicker, IconButton, Text, TextField, DayOfWeek, Dialog as DialogMS, DialogFooter as DialogFooterMS, DefaultButton, Modal, DialogType, IDialogFooterProps, IDialogProps, MessageBar, MessageBarType } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';
import FuzzySet from 'fuzzyset';
import InfiniteScroll from 'react-infinite-scroll-component';
import NewReport from './NewReport';
import { Report, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const Reports = (props: { domain: string | undefined; info: User; ws: WebSocket | undefined; }) => {

    const Dialog = (props: IDialogProps & { children: any }) => {
        return <DialogMS {...props}></DialogMS>;
    };

    const DialogFooter = (props: IDialogFooterProps & { children: any }) => {
        return <DialogFooterMS {...props}></DialogFooterMS>;
    };

    const [reports, setReports] = useState<Report[]>([]);
    const [reportsLoaded, setReportsLoaded] = useState<Report[]>([]);
    const [searchFound, setSearchFound] = useState<Report[] | boolean>(false);
    const [newReport, setNewReport] = useState(false);
    const [titlesFuzzySet, setTitlesFuzzySet] = useState(FuzzySet());
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [deleteDialog, setDeleteDialog] = useState('');
    const [editReport, setEditReport] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (localStorage.getItem("token") && localStorage.getItem("school")) {
            fetch(props.domain + '/reports', {
                headers: new Headers({
                    'Authorization': localStorage.getItem('token') ?? "",
                    'School': localStorage.getItem('school') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (!json?.error) {
                        const reports = (json as Array<Report>).sort((a, b) => b.date - a.date);
                        setReports(reports);
                        reports.forEach(report => {
                            setTitlesFuzzySet(titlesFuzzySet => {
                                titlesFuzzySet.add(report.title);
                                return titlesFuzzySet;
                            });
                        });
                        setReportsLoaded(reports.slice(0, 20));
                    } else {
                        setError(json.error);
                    }
                });
        }

        if (props.ws) {
            props.ws.addEventListener('message', (message: MessageEvent) => {
                if (message.data !== 'Ping!') {
                    const data = JSON.parse(message.data);
                    if (data.event === 'newReport') {
                        setReports(reports => {
                            let newReports = [data, ...reports];
                            return newReports;
                        });
                        setTitlesFuzzySet(titlesFuzzySet => {
                            titlesFuzzySet.add(data.title);
                            return titlesFuzzySet;
                        });
                    } else if (data.event === 'editedReport') {
                        setReports(reports => {
                            let newReports = [...reports];
                            newReports[newReports.findIndex(x => x.id === data.id)].title = data.newTitle;
                            return newReports;
                        });
                        setTitlesFuzzySet(titlesFuzzySet => {
                            titlesFuzzySet.add(data.newTitle);
                            return titlesFuzzySet;
                        });
                    } else if (data.event === 'deletedReport') {
                        setReports(reports => {
                            let newReports = [...reports];
                            newReports.splice(newReports.findIndex(x => x.id === data.id), 1);
                            return newReports;
                        });
                    }
                }
            });
        }
    }, []);

    useEffect(() => {
        if (date) {
            let reportsLoadedPre: Report[] = [];
            reports.forEach(report => {
                const reportDate = new Date(report.date);
                if (reportDate.getDate() === date.getDate() && reportDate.getMonth() === date.getMonth() && reportDate.getFullYear() === date.getFullYear()) {
                    reportsLoadedPre.push(report);
                    if (Array.isArray(searchFound) && !searchFound.includes(report)) {
                        reportsLoadedPre.pop();
                    }
                }
            });
            setReportsLoaded(reportsLoadedPre);
        } else if (typeof searchFound === 'object') {
            setReportsLoaded(reports.filter(x => searchFound.includes(x)))
        } else {
            setReportsLoaded(reports.slice(0, 20));
        }
    }, [date, searchFound]);

    function loadMore() {
        setReportsLoaded(reports.slice(0, reportsLoaded.length + 19));
    }

    const { t } = useTranslation();

    return (
        <Stack styles={{
            root: {
                margin: 25,
            }
        }}>
            {newReport ? <Modal isOpen styles={{
                main: {
                    width: 'calc(100% - 25px)',
                    height: 'calc(100% - 25px)'
                },
                scrollableContent: {
                    overflowY: 'none'
                }
            }}>
                <NewReport domain={props.domain} info={props.info} newReport={newReport} setNewReport={setNewReport}></NewReport>
            </Modal> : null}
            <Stack horizontal styles={{
                root: {
                    justifyContent: 'space-between'
                }
            }}>
                {props.info?.administrator ? <Stack.Item>
                    <PrimaryButton text={t('New report')} iconProps={{ iconName: 'Send' }} onClick={() => setNewReport(true)} />
                </Stack.Item> : null}
                <Stack.Item styles={{
                    root: {
                        width: '50%'
                    }
                }}>
                    <SearchBox placeholder={t('Search')} underlined onChange={event => {
                        if (event?.target.value) {
                            const found = titlesFuzzySet.get(event?.target.value ?? "", null, .1)?.map(x => x[1]);
                            let reportsLoadedPre: Report[] = [];
                            reports.forEach(report => {
                                if (found?.includes(report.title)) {
                                    reportsLoadedPre.push(report);
                                }
                            });
                            setSearchFound(reportsLoadedPre);
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
                    <DatePicker firstDayOfWeek={DayOfWeek.Sunday} placeholder={t('Select date...')} value={date} onSelectDate={date => date !== null && setDate(date)} />

                    <IconButton iconProps={{
                        iconName: 'ChromeClose'
                    }} onClick={() => setDate(undefined)} />
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
                {reportsLoaded.length > 0 ? <InfiniteScroll
                    dataLength={reportsLoaded.length}
                    next={loadMore}
                    hasMore={reportsLoaded.length !== reports.length}
                    loader={<Text styles={{
                        root: {
                            marginBottom: 25
                        }
                    }}>Loading...</Text>}>
                    {reportsLoaded.map(report => (
                        <Stack.Item key={report.id} styles={{
                            root: {
                                marginBottom: 25,
                                border: '1px solid black',
                                boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)'
                            }
                        }}>
                            <Stack styles={{
                                root: {
                                    cursor: 'default',
                                    height: 100,
                                    width: '100%',
                                    background: NeutralColors.white,
                                    justifyContent: 'center',
                                    paddingLeft: 25,
                                    paddingRight: 25
                                }
                            }}>
                                <Stack.Item>
                                    <Text>{report.author.name}</Text>
                                </Stack.Item>
                                <Stack.Item>
                                    <Text variant="smallPlus" styles={{
                                        root: {
                                            color: NeutralColors.gray130
                                        }
                                    }}>{new Date(Number(report.date)).toString()}</Text>
                                </Stack.Item>
                                <Stack.Item styles={{
                                    root: {
                                        marginBottom: 5
                                    }
                                }}>
                                    {editReport !== report.id ? <Text variant="large">{report.title}</Text> : <TextField placeholder={report.title} defaultValue={report.title} onChange={(event, value) => setNewTitle(value ?? '')} styles={{
                                        root: {
                                            marginRight: 121
                                        }
                                    }}></TextField>}
                                </Stack.Item>
                                <Stack horizontal styles={{
                                    root: {
                                        position: 'absolute',
                                        right: 50
                                    }
                                }}>
                                    {report.author.id === props.info?.id ? <>
                                        <Stack.Item>
                                            <IconButton iconProps={{ iconName: 'Delete' }} onClick={() => setDeleteDialog(report.id)} />
                                            <Dialog hidden={deleteDialog !== report.id} onDismiss={() => setDeleteDialog('')} dialogContentProps={{
                                                type: DialogType.largeHeader,
                                                title: t('Delete report?'),
                                                subText: t('Do you want to delete this report?'),
                                            }}>
                                                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} >
                                                    {t(error)}
                                                </MessageBar> : null}
                                                <DialogFooter>
                                                    <PrimaryButton onClick={() => {
                                                        fetch(props.domain + '/reports/' + report.id, {
                                                            method: 'DELETE',
                                                            headers: new Headers({
                                                                'Authorization': localStorage.getItem('token') ?? "",
                                                                'School': localStorage.getItem('school') ?? ""
                                                            })
                                                        }).then(res => res.json()).then(json => {
                                                            if (!json?.error) {
                                                                setDeleteDialog('');
                                                            } else {
                                                                setError(json.error);
                                                            }
                                                        });
                                                    }} text="Delete" />
                                                    <DefaultButton onClick={() => setDeleteDialog('')} text={t('Cancel')} />
                                                </DialogFooter>
                                            </Dialog>
                                        </Stack.Item>
                                        {editReport !== report.id ? <Stack.Item>
                                            <IconButton iconProps={{ iconName: 'Edit' }} onClick={() => setEditReport(report.id)} />
                                        </Stack.Item> : <Stack.Item>
                                            <IconButton iconProps={{ iconName: 'Save' }} onClick={() => {
                                                if (newTitle) {
                                                    fetch(props.domain + '/reports/' + report.id, {
                                                        method: 'PATCH',
                                                        body: JSON.stringify({
                                                            title: newTitle
                                                        }),
                                                        headers: new Headers({
                                                            'Authorization': localStorage.getItem('token') ?? "",
                                                            'School': localStorage.getItem('school') ?? "",
                                                            'Content-Type': 'application/json'
                                                        })
                                                    })
                                                        .then(res => res.json()).then(json => {
                                                            if (!json?.error) {
                                                                setNewTitle('');
                                                                setEditReport('');
                                                            } else {
                                                                setError(json.error);
                                                            }
                                                        });
                                                } else {
                                                    setEditReport('');
                                                }
                                            }} />
                                        </Stack.Item>}
                                    </> : null}
                                    <Stack.Item>
                                        <IconButton iconProps={{
                                            iconName: 'Download'
                                        }} onClick={() => {
                                            let clicky = document.createElement('a');
                                            clicky.href = props.domain + '/static/' + report.file.id + '?name=' + report.file.name;
                                            clicky.download = report.file.name;
                                            clicky.click();
                                        }} />
                                    </Stack.Item>
                                </Stack>
                            </Stack>
                        </Stack.Item>
                    ))}
                </InfiniteScroll> : <Text styles={{
                    root: {
                        marginBottom: 25
                    }
                }}>{t('No reports!')}</Text>}
            </Stack>
        </Stack>
    );
};

export default Reports;