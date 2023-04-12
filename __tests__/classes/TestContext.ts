import { PGDBManager, PGDBContext, PGDBSet} from '../../src/Index';
import { Message } from './RelationEntity';
import { Person } from './TestEntity';


export default class Context extends PGDBContext
{
    public Persons : PGDBSet<Person>;
    public Messages : PGDBSet<Message>;

    constructor(manager : PGDBManager)
    {
        super(manager);  
        this.Persons = new PGDBSet(Person, this);      
        this.Messages = new PGDBSet(Message, this);      
    }
}