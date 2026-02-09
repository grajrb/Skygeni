import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Collapse,
  IconButton,
  Box,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { RecommendationsData } from '../services/api';

interface RecommendationsProps {
  data: RecommendationsData;
}

export default function Recommendations({ data }: RecommendationsProps) {
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

  const handleExpandClick = (index: number) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High':
        return <PriorityHighIcon />;
      case 'Medium':
        return <WarningIcon />;
      case 'Low':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (data.recommendations.length === 0) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 3 }}>
            No recommendations at this time. Keep up the great work!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {data.recommendations.length} actionable {data.recommendations.length === 1 ? 'recommendation' : 'recommendations'} based on current data
        </Typography>
        <List sx={{ mt: 2 }}>
          {data.recommendations.map((rec, index) => (
            <Paper
              key={index}
              elevation={2}
              sx={{
                mb: 2,
                border: `2px solid ${
                  rec.priority === 'High' ? '#f44336' : 
                  rec.priority === 'Medium' ? '#ff9800' : 
                  '#2196f3'
                }`,
                borderRadius: 2
              }}
            >
              <ListItem
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                  <Chip
                    icon={getPriorityIcon(rec.priority)}
                    label={rec.priority}
                    color={getPriorityColor(rec.priority) as any}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Chip
                    label={rec.metric}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 'auto' }}
                  />
                  <IconButton
                    onClick={() => handleExpandClick(index)}
                    sx={{
                      transform: expanded[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                    size="small"
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {rec.action}
                    </Typography>
                  }
                />
                <Collapse in={expanded[index]} timeout="auto" unmountOnExit sx={{ width: '100%', mt: 1 }}>
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Details:</strong> {rec.detail}
                    </Typography>
                  </Box>
                </Collapse>
              </ListItem>
            </Paper>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
