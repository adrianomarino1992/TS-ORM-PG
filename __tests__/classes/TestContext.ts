import PGDBContext from '../../src/implementations/PGDBContext';
import PGDBManager from '../../src/implementations/PGDBManager';
import PGDBSet from '../../src/implementations/PGDBSet';
import { Person } from './TestEntity';


export default class Context extends PGDBContext
{
    public Persons : PGDBSet<Person>;

    constructor(manager : PGDBManager)
    {
        super(manager);  
        this.Persons = new PGDBSet(Person, manager);      
    }
}